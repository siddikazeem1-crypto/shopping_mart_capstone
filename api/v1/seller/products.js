import { db, setCors, send, nowIso, getBearer, getUserIdFromToken, getUserById, ensureSeedUsers } from "../../lib/firebase.js";
import crypto from "node:crypto";

async function requireSeller(firestore, req, res) {
  const token = getBearer(req);
  const userId = await getUserIdFromToken(firestore, token);
  if (!userId) { send(res, 401, { error: "Authorization header with Bearer token required" }); return null; }
  const user = await getUserById(firestore, userId);
  if (!user) { send(res, 401, { error: "Invalid or expired token" }); return null; }
  const role = user.role || "customer";
  if (role !== "seller" && role !== "admin") { send(res, 403, { error: "Seller only" }); return null; }
  return { user, userId, role };
}

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  try {
    const firestore = await db();
    await ensureSeedUsers(firestore);
    const ctx = await requireSeller(firestore, req, res);
    if (!ctx) return;
    const { userId } = ctx;

    if (req.method === "GET") {
      const snap = await firestore.collection("products").where("sellerId", "==", userId).get();
      return send(res, 200, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    if (req.method === "POST") {
      const { name, price, description = "", stock = 0 } = req.body || {};
      if (!name || price === undefined) {
        return send(res, 400, { error: "Name and price are required" });
      }
      const id = crypto.randomUUID();
      const ts = nowIso();
      const item = {
        id,
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        sellerId: userId,
        created_at: ts,
        updated_at: ts,
      };
      await firestore.collection("products").doc(id).set(item);
      return send(res, 201, item);
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
