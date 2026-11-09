import { db, setCors, send, nowIso, getBearer, getUserIdFromToken, getUserById, ensureSeedUsers } from "../../../lib/firebase.js";
import crypto from "node:crypto";

export default async function handler(req, res, deps = {}) {
  const { setCors: sc, send: s, db: dbFn, nowIso: ni, getBearer: gb, getUserIdFromToken: guit, getUserById: guib, ensureSeedUsers: esu } = deps;
  const _setCors = sc || setCors;
  const _send = s || send;
  const _db = dbFn || db;
  const _now = ni || nowIso;
  const _bearer = gb || getBearer;
  const _uid = guit || getUserIdFromToken;
  const _userById = guib || getUserById;
  const _seed = esu || ensureSeedUsers;

  if (_setCors(req, res)) return;
  try {
    const firestore = await _db();
    await _seed(firestore);

    const token = _bearer(req);
    const userId = await _uid(firestore, token);
    if (!userId) { _send(res, 401, { error: "Authorization header with Bearer token required" }); return; }
    const user = await _userById(firestore, userId);
    if (!user) { _send(res, 401, { error: "Invalid or expired token" }); return; }
    const role = user.role || "customer";
    if (role !== "seller" && role !== "admin") { _send(res, 403, { error: "Seller only" }); return; }

    const id = (req.query && req.query.id) || "";

    if (req.method === "GET" && !id) {
      const snap = await firestore.collection("products").where("sellerId", "==", userId).get();
      return _send(res, 200, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    if (req.method === "POST" && !id) {
      const { name, price, description = "", stock = 0 } = req.body || {};
      if (!name || price === undefined) {
        return _send(res, 400, { error: "Name and price are required" });
      }
      const newId = crypto.randomUUID();
      const ts = _now();
      const item = {
        id: newId,
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        sellerId: userId,
        created_at: ts,
        updated_at: ts,
      };
      await firestore.collection("products").doc(newId).set(item);
      return _send(res, 201, item);
    }

    if (!id) return _send(res, 400, { error: "Product id required" });
    const ref = firestore.collection("products").doc(id);

    if (req.method === "GET") {
      const doc = await ref.get();
      if (!doc.exists) return _send(res, 404, { error: "Product not found" });
      const data = { id: doc.id, ...doc.data() };
      if (role !== "admin" && data.sellerId !== userId) return _send(res, 403, { error: "Not your product" });
      return _send(res, 200, data);
    }

    if (req.method === "PUT") {
      const doc = await ref.get();
      if (!doc.exists) return _send(res, 404, { error: "Product not found" });
      const cur = doc.data();
      if (role !== "admin" && cur.sellerId !== userId) return _send(res, 403, { error: "Not your product" });
      const body = req.body || {};
      const updated = {
        ...cur,
        id: doc.id,
        name: body.name ?? cur.name,
        description: body.description ?? cur.description,
        price: body.price !== undefined ? Number(body.price) : cur.price,
        stock: body.stock !== undefined ? Number(body.stock) : cur.stock,
        updated_at: _now(),
      };
      await ref.set(updated);
      return _send(res, 200, updated);
    }

    if (req.method === "DELETE") {
      const doc = await ref.get();
      if (!doc.exists) return _send(res, 404, { error: "Product not found" });
      const cur = doc.data();
      if (role !== "admin" && cur.sellerId !== userId) return _send(res, 403, { error: "Not your product" });
      await ref.delete();
      return _send(res, 200, { message: "Product deleted successfully" });
    }

    return _send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
