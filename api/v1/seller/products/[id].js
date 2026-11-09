import { db, setCors, send, nowIso, getBearer, getUserIdFromToken, getUserById, ensureSeedUsers } from "../../../lib/firebase.js";

async function requireSeller(firestore, req, res) {
  const token = getBearer(req);
  const userId = await getUserIdFromToken(firestore, token);
  if (!userId) { send(res, 401, { error: "Authorization header with Bearer token required" }); return null; }
  const user = await getUserById(firestore, userId);
  if (!user) { send(res, 401, { error: "Invalid or expired token" }); return null; }
  const role = user.role || "customer";
  if (role !== "seller" && role !== "admin") { send(res, 403, { error: "Seller only" }); return null; }
  return { user, userId, role };
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  const { id } = req.query || {};
  if (!id) return send(res, 400, { error: "Product id required" });
  try {
    const firestore = await db();
    await ensureSeedUsers(firestore);
    const ctx = await requireSeller(firestore, req, res);
    if (!ctx) return;
    const { userId, role } = ctx;

    const ref = firestore.collection("products").doc(id);

    if (req.method === "GET") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "Product not found" });
      const data = { id: doc.id, ...doc.data() };
      if (role !== "admin" && data.sellerId !== userId) return send(res, 403, { error: "Not your product" });
      return send(res, 200, data);
    }

    if (req.method === "PUT") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "Product not found" });
      const cur = doc.data();
      if (role !== "admin" && cur.sellerId !== userId) return send(res, 403, { error: "Not your product" });
      const body = req.body || {};
      const updated = {
        ...cur,
        id: doc.id,
        name: body.name ?? cur.name,
        description: body.description ?? cur.description,
        price: body.price !== undefined ? Number(body.price) : cur.price,
        stock: body.stock !== undefined ? Number(body.stock) : cur.stock,
        updated_at: nowIso(),
      };
      await ref.set(updated);
      return send(res, 200, updated);
    }

    if (req.method === "DELETE") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "Product not found" });
      const cur = doc.data();
      if (role !== "admin" && cur.sellerId !== userId) return send(res, 403, { error: "Not your product" });
      await ref.delete();
      return send(res, 200, { message: "Product deleted successfully" });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
