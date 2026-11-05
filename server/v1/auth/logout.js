import { db, setCors, send, getBearer } from "../../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const token = getBearer(req);
  if (!token) return send(res, 401, { error: "Authorization header with Bearer token required" });
  try {
    const firestore = db();
    const ref = firestore.collection("tokens").doc(token);
    const doc = await ref.get();
    if (!doc.exists) return send(res, 401, { error: "Invalid or expired token" });
    await ref.delete();
    return send(res, 200, { message: "Logged out successfully" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
