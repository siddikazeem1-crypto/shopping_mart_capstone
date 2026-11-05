import { db, setCors, send, omitPassword, ensureSeedUsers } from "../../../../lib/firebase.js";

export default async function handler(req, res) {
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  try {
    const firestore = db();
    await ensureSeedUsers(firestore);
    const snap = await firestore.collection("users").get();
    return send(res, 200, snap.docs.map((d) => omitPassword({ id: d.id, ...d.data() })));
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
