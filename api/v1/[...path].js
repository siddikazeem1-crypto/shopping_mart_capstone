// Catch-all Vercel function for the Azeem Mart API.
// Lives at api/v1/[...path].js and handles single-segment routes
// (e.g. /api/v1/hello, /api/v1/cart, /api/v1/products). Multi-segment
// routes are served by dedicated files under api/v1/ (auth/*, cart/[productId], ...).
import chat from '../../server/v1/chat.js';
import health from '../../server/v1/health.js';
import hello from '../../server/v1/hello.js';
import adminStats from '../../server/v1/admin/stats.js';
import authLogin from './auth/login.js';
import authLogout from './auth/logout.js';
import authRegister from './auth/register.js';
import authUsers from './auth/users.js';
import authValidate from './auth/validate.js';
import cartIndex from '../../server/v1/cart/index.js';
import ordersIndex from '../../server/v1/orders/index.js';
import ordersCheckout from '../../server/v1/orders/checkout.js';
import productsIndex from '../../server/v1/products/index.js';
import productsSearch from '../../server/v1/products/search.js';
import sellerStats from '../../server/v1/seller/stats.js';

import { setCors, send, db, hashPassword, omitPassword, generateToken, nowIso, ensureSeedUsers, getBearer, getUserIdFromToken, getUserById } from '../../lib/firebase.js';

const deps = {
  setCors,
  send,
  db,
  hashPassword,
  omitPassword,
  generateToken,
  nowIso,
  ensureSeedUsers,
  getBearer,
  getUserIdFromToken,
  getUserById,
};

const routes = new Map([
  ['chat', chat],
  ['health', health],
  ['hello', hello],
  ['admin/stats', adminStats],
  ['auth/login', authLogin],
  ['auth/logout', authLogout],
  ['auth/register', authRegister],
  ['auth/users', authUsers],
  ['auth/validate', authValidate],
  ['cart', cartIndex],
  ['orders', ordersIndex],
  ['orders/checkout', ordersCheckout],
  ['products', productsIndex],
  ['products/search', productsSearch],
  ['seller/stats', sellerStats]
]);

function notFound(res, key, url) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Not found', key, url }));
}

export default async function handler(req, res) {
  try {
    const urlPath = (req.url || '').split('?')[0];
    const segments = urlPath.split('/').filter(Boolean);
    // Route lives at api/v1/[...path].js under api/; strip the api/v1 prefix.
    if (segments.length >= 2 && segments[0] === 'api' && segments[1] === 'v1') {
      segments = segments.slice(2);
    }
    const key = segments.join('/');
    req.query = { ...(req.query || {}) };

    if (routes.has(key)) return routes.get(key)(req, res, deps);
    return notFound(res, key, req.url);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'invocation_failed', message: String(e && e.message ? e.message : e) }));
  }
}
