import { db, setCors, send, hashPassword, omitPassword, generateToken, nowIso, ensureSeedUsers } from "../../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const { username, password } = req.body || {};
  if (!username || !password) {
    return send(res, 400, { error: "Username and password are required" });
  }
  try {
    const firestore = db();
    await ensureSeedUsers(firestore);
    const snap = await firestore.collection("users").where("username", "==", username).limit(1).get();
    if (snap.empty) return send(res, 401, { error: "Invalid username or password" });
    const user = { id: snap.docs[0].id, ...snap.docs[0].data() };
    if (user.password !== hashPassword(password)) {
      return send(res, 401, { error: "Invalid username or password" });
    }
    const token = generateToken();
    await firestore.collection("tokens").doc(token).set({ userId: user.id, created_at: nowIso() });
    return send(res, 200, { token, user: omitPassword(user) });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
