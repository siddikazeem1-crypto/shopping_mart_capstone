import { db, setCors, send, getBearer, getUserIdFromToken, getUserById, omitPassword } from "../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  try {
    const firestore = db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const user = omitPassword(await getUserById(firestore, userId));
    if (!user) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const products = await firestore.collection("products").get();
    return send(res, 200, {
      role: user.role || "customer",
      productCount: products.size,
      note: "Seller ownership filter planned",
    });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
