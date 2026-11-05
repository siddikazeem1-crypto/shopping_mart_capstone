import { db, setCors, send } from "../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  try {
    const { q = "", minPrice = "", maxPrice = "" } = req.query || {};
    const min = minPrice === "" ? -1 : Number(minPrice);
    const max = maxPrice === "" ? -1 : Number(maxPrice);
    const snap = await db().collection("products").get();
    const out = [];
    for (const d of snap.docs) {
      const p = { id: d.id, ...d.data() };
      if (q && !String(p.name || "").includes(q)) continue;
      const price = Number(p.price || 0);
      if (min >= 0 && price < min) continue;
      if (max >= 0 && price > max) continue;
      out.push(p);
    }
    return send(res, 200, out);
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
