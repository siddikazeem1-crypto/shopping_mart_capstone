import chat from '../../server/v1/chat.js';
import health from '../../server/v1/health.js';
import hello from '../../server/v1/hello.js';
import adminStats from '../../server/v1/admin/stats.js';
import authLogin from '../../server/v1/auth/login.js';
import authLogout from '../../server/v1/auth/logout.js';
import authRegister from '../../server/v1/auth/register.js';
import authUsers from '../../server/v1/auth/users.js';
import authValidate from '../../server/v1/auth/validate.js';
import cartIndex from '../../server/v1/cart/index.js';
import cartProduct from '../../server/v1/cart/[productId].js';
import ordersCheckout from '../../server/v1/orders/checkout.js';
import ordersIndex from '../../server/v1/orders/index.js';
import orderById from '../../server/v1/orders/[id].js';
import orderStatus from '../../server/v1/orders/[id]/status.js';
import productsIndex from '../../server/v1/products/index.js';
import productsSearch from '../../server/v1/products/search.js';
import productById from '../../server/v1/products/[id].js';
import productReviews from '../../server/v1/products/[id]/reviews.js';
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

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Not found' }));
}

export default async function handler(req, res) {
  const rawPath = req.query?.path;
  const segments = Array.isArray(rawPath) ? rawPath.filter(Boolean) : String(rawPath || '').split('/').filter(Boolean);
  const key = segments.join('/');
  req.query = { ...(req.query || {}) };
  delete req.query.path;

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

  return notFound(res);
}
