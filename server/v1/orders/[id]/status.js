import { db, setCors, send, getBearer, getUserIdFromToken } from "../../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "PUT") return send(res, 405, { error: "Method not allowed" });
  const { id } = req.query || {};
  const { status } = req.body || {};
  if (!id) return send(res, 400, { error: "Order id required" });
  if (!["created", "paid", "shipped"].includes(status)) {
    return send(res, 400, { error: "Status must be created, paid, or shipped" });
  }
  try {
    const firestore = db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const ref = firestore.collection("orders").doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== userId) {
      return send(res, 404, { error: "Order not found" });
    }
    await ref.update({ status });
    const updated = await ref.get();
    return send(res, 200, { id: updated.id, ...updated.data() });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
