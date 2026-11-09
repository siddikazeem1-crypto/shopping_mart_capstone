import { db, setCors, send, hashPassword, omitPassword, nowIso, getBearer, getUserIdFromToken, getUserById, ensureSeedUsers } from "../../../lib/firebase.js";
import crypto from "node:crypto";

async function requireAdmin(firestore, req, res) {
  const token = getBearer(req);
  const userId = await getUserIdFromToken(firestore, token);
  if (!userId) { send(res, 401, { error: "Authorization header with Bearer token required" }); return null; }
  const user = await getUserById(firestore, userId);
  if (!user) { send(res, 401, { error: "Invalid or expired token" }); return null; }
  if ((user.role || "customer") !== "admin") { send(res, 403, { error: "Admin only" }); return null; }
  return user;
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  try {
    const firestore = await db();
    await ensureSeedUsers(firestore);
    const adminUser = await requireAdmin(firestore, req, res);
    if (!adminUser) return;

    if (req.method === "GET") {
      const snap = await firestore.collection("users").get();
      return send(res, 200, snap.docs.map((d) => omitPassword({ id: d.id, ...d.data() })));
    }

    if (req.method === "POST") {
      const { username, email, password, role } = req.body || {};
      if (!username || !email || !password) {
        return send(res, 400, { error: "Username, email, and password are required" });
      }
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
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
