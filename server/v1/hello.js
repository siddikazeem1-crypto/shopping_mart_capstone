export default async function handler(req, res, deps = {}) {
  const { setCors, send } = deps;
  if (setCors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  return send(res, 200, { message: "Welcome to Azeem Mart API" });
}

