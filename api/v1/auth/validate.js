import { db, setCors, send, getBearer, omitPassword, getUserById } from "../../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  const token = getBearer(req);
  if (!token) return send(res, 401, { error: "Authorization header with Bearer token required" });
  try {
    const firestore = db();
    const tdoc = await firestore.collection("tokens").doc(token).get();
    if (!tdoc.exists) return send(res, 401, { error: "Invalid or expired token" });
    const user = await getUserById(firestore, tdoc.data().userId);
    if (!user) return send(res, 401, { error: "Invalid or expired token" });
    return send(res, 200, omitPassword(user));
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
