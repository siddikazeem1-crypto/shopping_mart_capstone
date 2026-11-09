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

export default async function handler(req, res, deps = {}) {
  const { setCors: sc, send: s, db: dbFn, hashPassword: hp, omitPassword: op, nowIso: ni, getBearer: gb, getUserIdFromToken: guit, getUserById: guib, ensureSeedUsers: esu } = deps;
  const _setCors = sc || setCors;
  const _send = s || send;
  const _db = dbFn || db;
  const _hash = hp || hashPassword;
  const _omit = op || omitPassword;
  const _now = ni || nowIso;
  const _bearer = gb || getBearer;
  const _uid = guit || getUserIdFromToken;
  const _userById = guib || getUserById;
  const _seed = esu || ensureSeedUsers;

  if (_setCors(req, res)) return;
  try {
    const firestore = await _db();
    await _seed(firestore);
    const adminUser = await (async () => {
      const token = _bearer(req);
      const userId = await _uid(firestore, token);
      if (!userId) { _send(res, 401, { error: "Authorization header with Bearer token required" }); return null; }
      const user = await _userById(firestore, userId);
      if (!user) { _send(res, 401, { error: "Invalid or expired token" }); return null; }
      if ((user.role || "customer") !== "admin") { _send(res, 403, { error: "Admin only" }); return null; }
      return user;
    })();
    if (!adminUser) return;

    const id = (req.query && req.query.id) || "";

    if (req.method === "GET" && !id) {
      const snap = await firestore.collection("users").get();
      return _send(res, 200, snap.docs.map((d) => _omit({ id: d.id, ...d.data() })));
    }

    if (req.method === "POST" && !id) {
      const { username, email, password, role } = req.body || {};
      if (!username || !email || !password) {
        return _send(res, 400, { error: "Username, email, and password are required" });
      }
      const users = firestore.collection("users");
      const byName = await users.where("username", "==", username).limit(1).get();
      if (!byName.empty) return _send(res, 400, { error: "Username already exists" });
      const byEmail = await users.where("email", "==", email).limit(1).get();
      if (!byEmail.empty) return _send(res, 400, { error: "Email already registered" });
      const newId = crypto.randomUUID();
      const ts = _now();
      const user = {
        id: newId,
        username,
        email,
        password: _hash(password),
        role: role || "customer",
        created_at: ts,
        updated_at: ts,
      };
      await users.doc(newId).set(user);
      return _send(res, 201, _omit(user));
    }

    if (!id) return _send(res, 400, { error: "User id required" });
    const ref = firestore.collection("users").doc(id);

    if (req.method === "GET") {
      const doc = await ref.get();
      if (!doc.exists) return _send(res, 404, { error: "User not found" });
      return _send(res, 200, _omit({ id: doc.id, ...doc.data() }));
    }

    if (req.method === "PUT") {
      const doc = await ref.get();
      if (!doc.exists) return _send(res, 404, { error: "User not found" });
      const cur = doc.data();
      const body = req.body || {};
      const updated = {
        ...cur,
        id: doc.id,
        username: body.username ?? cur.username,
        email: body.email ?? cur.email,
        role: body.role ?? cur.role,
        updated_at: _now(),
      };
      if (body.password) updated.password = _hash(body.password);
      await ref.set(updated);
      return _send(res, 200, _omit(updated));
    }

    if (req.method === "DELETE") {
      const doc = await ref.get();
      if (!doc.exists) return _send(res, 404, { error: "User not found" });
      if (id === adminUser.id) return _send(res, 400, { error: "Cannot delete your own account" });
      await ref.delete();
      const toks = await firestore.collection("tokens").where("userId", "==", id).get();
      const batch = firestore.batch();
      toks.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return _send(res, 200, { message: "User deleted successfully" });
    }

    return _send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    const _send2 = send;
    _send2(res, 500, { error: e.message });
  }
}
