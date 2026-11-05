export default async function handler(req, res, deps = {}) {
  const { setCors, send, db, getBearer, getUserIdFromToken } = deps;
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  try {
    const firestore = await db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const snap = await firestore.collection("orders").where("userId", "==", userId).get();
    return send(res, 200, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
