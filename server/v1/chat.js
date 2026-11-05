export default async function handler(req, res, deps = {}) {
  const { setCors, send } = deps;
  if (setCors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const { message = "" } = req.body || {};
  if (!message) return send(res, 400, { error: "message is required" });
  let reply = "Azeem Mart bot: I can help with products, orders, and auth. LLM integration planned.";
  if (message.includes("hour")) reply = "Azeem Mart bot: Open 9am-9pm.";
  else if (message.includes("return")) reply = "Azeem Mart bot: Returns within 7 days with bill.";
  else if (message.includes("offer")) reply = "Azeem Mart bot: Check /api/v1/products/search for deals.";
  return send(res, 200, { reply, echo: message });
}

