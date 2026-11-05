import { db, setCors, send, getBearer, getUserIdFromToken, nowIso } from "../../../lib/firebase.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  const { id: productId } = req.query || {};
  if (!productId) return send(res, 400, { error: "Product id required" });
  try {
    const firestore = db();
    if (req.method === "GET") {
      const snap = await firestore.collection("reviews").where("productId", "==", productId).get();
      return send(res, 200, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    if (req.method === "POST") {
      const userId = await getUserIdFromToken(firestore, getBearer(req));
      if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
      const { rating = 5, comment = "" } = req.body || {};
      if (rating < 1 || rating > 5) return send(res, 400, { error: "Rating must be 1-5" });
      const prod = await firestore.collection("products").doc(productId).get();
      if (!prod.exists) return send(res, 400, { error: "Product not found" });
      const id = crypto.randomUUID().slice(0, 8);
      const review = { id, productId, userId, rating: Number(rating), comment, created_at: nowIso() };
      await firestore.collection("reviews").doc(id).set(review);
      return send(res, 201, review);
    }
    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
