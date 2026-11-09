import { db, setCors, send, hashPassword, omitPassword, nowIso, getBearer, getUserIdFromToken, getUserById, ensureSeedUsers } from "../../../lib/firebase.js";

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
  const { id } = req.query || {};
  if (!id) return send(res, 400, { error: "User id required" });
  try {
    const firestore = await db();
    await ensureSeedUsers(firestore);
    const adminUser = await requireAdmin(firestore, req, res);
    if (!adminUser) return;

    const ref = firestore.collection("users").doc(id);

    if (req.method === "GET") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "User not found" });
      return send(res, 200, omitPassword({ id: doc.id, ...doc.data() }));
    }

    if (req.method === "PUT") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "User not found" });
      const cur = doc.data();
      const body = req.body || {};
      const updated = {
        ...cur,
        id: doc.id,
        username: body.username ?? cur.username,
        email: body.email ?? cur.email,
        role: body.role ?? cur.role,
        updated_at: nowIso(),
      };
      if (body.password) updated.password = hashPassword(body.password);
      await ref.set(updated);
      return send(res, 200, omitPassword(updated));
    }

    if (req.method === "DELETE") {
      const doc = await ref.get();
      if (!doc.exists) return send(res, 404, { error: "User not found" });
      if (id === adminUser.id) return send(res, 400, { error: "Cannot delete your own account" });
      await ref.delete();
      const toks = await firestore.collection("tokens").where("userId", "==", id).get();
      const batch = firestore.batch();
      toks.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return send(res, 200, { message: "User deleted successfully" });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
