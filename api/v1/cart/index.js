import { db, setCors, send, getBearer, getUserIdFromToken, nowIso } from "../../../lib/firebase.js";

async function readCart(firestore, userId) {
  const doc = await firestore.collection("carts").doc(userId).get();
  return doc.exists ? doc.data().items || [] : [];
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  try {
    const firestore = db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });

    if (req.method === "GET") {
      return send(res, 200, await readCart(firestore, userId));
    }

    if (req.method === "POST") {
      const { productId, quantity = 1 } = req.body || {};
      if (!productId) return send(res, 400, { error: "productId and quantity are required" });
      const qty = Number(quantity);
      if (qty < 1) return send(res, 400, { error: "Quantity must be >= 1" });
      const prod = await firestore.collection("products").doc(productId).get();
      if (!prod.exists) return send(res, 400, { error: "Product not found" });
      const items = await readCart(firestore, userId);
      const line = items.find((i) => i.productId === productId);
      if (line) {
        line.quantity += qty;
        line.updated_at = nowIso();
      } else {
        items.push({ userId, productId, quantity: qty, created_at: nowIso() });
      }
      await firestore.collection("carts").doc(userId).set({ items, updated_at: nowIso() });
      return send(res, 201, items.find((i) => i.productId === productId));
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
