import { db, setCors, send, getBearer, getUserIdFromToken } from "../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  const { id } = req.query || {};
  if (!id) return send(res, 400, { error: "Order id required" });
  try {
    const firestore = db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const doc = await firestore.collection("orders").doc(id).get();
    if (!doc.exists || doc.data().userId !== userId) {
      return send(res, 404, { error: "Order not found" });
    }
    return send(res, 200, { id: doc.id, ...doc.data() });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
