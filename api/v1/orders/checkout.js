import { db, setCors, send, getBearer, getUserIdFromToken, nowIso } from "../../../lib/firebase.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  try {
    const firestore = db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const cartDoc = await firestore.collection("carts").doc(userId).get();
    const items = cartDoc.exists ? cartDoc.data().items || [] : [];
    if (!items.length) return send(res, 400, { error: "Cart is empty" });
    let total = 0;
    for (const line of items) {
      const p = await firestore.collection("products").doc(line.productId).get();
      const price = p.exists ? Number(p.data().price || 0) : 0;
      total += price * Number(line.quantity || 1);
    }
    const id = crypto.randomUUID();
    const order = {
      id,
      userId,
      items,
      itemCount: items.length,
      total,
      status: "created",
      created_at: nowIso(),
    };
    await firestore.collection("orders").doc(id).set(order);
    await firestore.collection("carts").doc(userId).set({ items: [], updated_at: nowIso() });
    return send(res, 201, order);
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
