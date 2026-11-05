import { db, setCors, send, getBearer, getUserIdFromToken, getUserById } from "../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  try {
    const firestore = db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const user = await getUserById(firestore, userId);
    if (!user) return send(res, 401, { error: "Authorization header with Bearer token required" });
    if ((user.role || "customer") !== "admin") return send(res, 403, { error: "Admin only" });
    const [users, products] = await Promise.all([
      firestore.collection("users").get(),
      firestore.collection("products").get(),
    ]);
    return send(res, 200, { userCount: users.size, productCount: products.size });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
