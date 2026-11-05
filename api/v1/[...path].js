// Catch-all Vercel function for the Azeem Mart API.
// Lives at api/v1/[...path].js so both single- and multi-segment paths
// (e.g. /api/v1/hello and /api/v1/auth/login) route through here.
// Route keys are relative to /api/v1, e.g. auth/login, cart, products.
import chat from '../../server/v1/chat.js';
import health from '../../server/v1/health.js';
import hello from '../../server/v1/hello.js';
import adminStats from '../../server/v1/admin/stats.js';
import authLogin from './auth/login.js';
import authLogout from './auth/logout.js';
import authRegister from './auth/register.js';
import authUsers from './auth/users.js';
import authValidate from './auth/validate.js';
import cartIndex from './cart/index.js';
import cartProduct from './cart/[productId].js';
import ordersCheckout from './orders/checkout.js';
import ordersIndex from './orders/index.js';
import orderById from './orders/[id].js';
import orderStatus from './orders/[id]/status.js';
import productsIndex from './products/index.js';
import productsSearch from './products/search.js';
import productById from './products/[id].js';
import productReviews from './products/[id]/reviews.js';
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

    if (segments.length === 2 && segments[0] === 'cart') {
      req.query.productId = segments[1];
      return cartProduct(req, res, deps);
    }

    if (segments.length === 2 && segments[0] === 'orders') {
      req.query.id = segments[1];
      return orderById(req, res, deps);
    }

    if (segments.length === 3 && segments[0] === 'orders' && segments[2] === 'status') {
      req.query.id = segments[1];
      return orderStatus(req, res, deps);
    }

    if (segments.length === 2 && segments[0] === 'products') {
      req.query.id = segments[1];
      return productById(req, res, deps);
    }

    if (segments.length === 3 && segments[0] === 'products' && segments[2] === 'reviews') {
      req.query.id = segments[1];
      return productReviews(req, res, deps);
    }

    return notFound(res, key, req.url);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'invocation_failed', message: String(e && e.message ? e.message : e) }));
  }
}
