import { db, setCors, send, hashPassword, omitPassword, nowIso, ensureSeedUsers } from "../../../../lib/firebase.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const { username, email, password, role } = req.body || {};
  if (!username || !email || !password) {
    return send(res, 400, { error: "Username, email, and password are required" });
  }
  try {
    const firestore = db();
    await ensureSeedUsers(firestore);
    const users = firestore.collection("users");
    const byName = await users.where("username", "==", username).limit(1).get();
    if (!byName.empty) return send(res, 400, { error: "Username already exists" });
    const byEmail = await users.where("email", "==", email).limit(1).get();
    if (!byEmail.empty) return send(res, 400, { error: "Email already registered" });
    const id = crypto.randomUUID();
    const ts = nowIso();
    const user = {
      id,
      username,
      email,
      password: hashPassword(password),
      role: role || "customer",
      created_at: ts,
      updated_at: ts,
    };
    await users.doc(id).set(user);
    return send(res, 201, omitPassword(user));
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
