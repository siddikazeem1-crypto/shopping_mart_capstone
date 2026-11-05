import { db, setCors, send, nowIso } from "../../../lib/firebase.js";
import crypto from "node:crypto";

function matches(item, q, minPrice, maxPrice) {
  if (q && !String(item.name || "").includes(q)) return false;
  const price = Number(item.price || 0);
  if (minPrice >= 0 && price < minPrice) return false;
  if (maxPrice >= 0 && price > maxPrice) return false;
  return true;
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  try {
    const firestore = db();
    const products = firestore.collection("products");

    if (req.method === "GET") {
      const { q = "", minPrice = "", maxPrice = "" } = req.query || {};
      const min = minPrice === "" ? -1 : Number(minPrice);
      const max = maxPrice === "" ? -1 : Number(maxPrice);
      const snap = await products.get();
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Reuse for both list and ?q/min/max filter (mirrors C++ searchProducts)
      return send(res, 200, all.filter((p) => matches(p, q, min, max)));
    }

    if (req.method === "POST") {
      const { name, price, description = "", stock = 0 } = req.body || {};
      if (!name || price === undefined) {
        return send(res, 400, { error: "Name and price are required" });
      }
      const id = crypto.randomUUID();
      const ts = nowIso();
      const item = { id, name, description, price: Number(price), stock: Number(stock), created_at: ts, updated_at: ts };
      await products.doc(id).set(item);
      return send(res, 201, item);
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
