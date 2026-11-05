export default async function handler(req, res, deps = {}) {
  const { setCors, send, db, getBearer, getUserIdFromToken, nowIso } = deps;
  if (setCors(req, res)) return;
  if (req.method !== "DELETE") return send(res, 405, { error: "Method not allowed" });
  const { productId } = req.query || {};
  if (!productId) return send(res, 400, { error: "Product id required" });
  try {
    const firestore = await db();
    const userId = await getUserIdFromToken(firestore, getBearer(req));
    if (!userId) return send(res, 401, { error: "Authorization header with Bearer token required" });
    const ref = firestore.collection("carts").doc(userId);
    const doc = await ref.get();
    const items = doc.exists ? doc.data().items || [] : [];
    const next = items.filter((i) => i.productId !== productId);
    if (next.length === items.length) return send(res, 404, { error: "Item not found in cart" });
    await ref.set({ items: next, updated_at: nowIso() });
    return send(res, 200, { message: "Removed from cart" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
