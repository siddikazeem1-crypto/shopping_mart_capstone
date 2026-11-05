import { db, setCors, send, nowIso } from "../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  const { id } = req.query || {};
  if (!id) return send(res, 400, { error: "Product id required" });
  try {
    const ref = db().collection("products").doc(id);

    if (req.method === "GET") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "Product not found" });
      return send(res, 200, { id: doc.id, ...doc.data() });
    }

    if (req.method === "PUT") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "Product not found" });
      const cur = doc.data();
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
      await ref.delete();
      return send(res, 200, { message: "Product deleted successfully" });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
