const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const LIVE_API = 'https://azeem-mart-capstone.vercel.app';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

async function proxyReq(req, res, apiPath) {
  const url = LIVE_API + apiPath;
  const bodyChunks = [];

  for (const chunk of await collectBody(req)) {
    bodyChunks.push(chunk);
  }
  const body = Buffer.concat(bodyChunks);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;

  const liveReq = http.request(url, {
    method: req.method,
    headers,
  }, (liveRes) => {
    res.writeHead(liveRes.statusCode, { ...liveRes.headers, 'Access-Control-Allow-Origin': '*' });
    liveRes.pipe(res);
  });

  liveReq.write(body);
  liveReq.end();

  liveReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: e.message }));
  });
}

function collectBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(chunks));
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const parsedUrl = new URL(url, 'http://localhost');

  // Proxy API calls to live Vercel backend
  if (parsedUrl.pathname.startsWith('/api/')) {
    await proxyReq(req, res, parsedUrl.pathname + parsedUrl.search);
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : '.' + parsedUrl.pathname);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
  console.log(`Connected to live API: ${LIVE_API}`);
});
