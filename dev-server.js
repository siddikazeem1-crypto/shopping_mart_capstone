import http from 'http';
import fs from 'fs';
import path from 'path';

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

function collectBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function proxyReq(req, res, apiPath) {
  const url = LIVE_API + apiPath;
  const body = await collectBody(req);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers.origin;

  const liveReq = http.request(url, {
    method: req.method,
    headers,
  }, (liveRes) => {
    res.writeHead(liveRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...liveRes.headers,
    });
    liveRes.pipe(res);
  });

  liveReq.write(body);
  liveReq.end();

  liveReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: e.message }));
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const parsedUrl = new URL(url, 'http://localhost');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Proxy API calls to live Vercel backend
  if (parsedUrl.pathname.startsWith('/api/')) {
    await proxyReq(req, res, parsedUrl.pathname + parsedUrl.search);
    return;
  }

  // Serve static files
  let filePath = path.join(process.cwd(), parsedUrl.pathname === '/' ? 'index.html' : '.' + parsedUrl.pathname);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
  console.log(`Connected to live API: ${LIVE_API}`);
});
