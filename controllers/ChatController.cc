// ============================================================
// MODULE: ChatController
// PURPOSE: Implementation of chatbot stub.
// WHY: Keyword replies for demo; replace with LLM call later.
// ARCHITECTURE: Controller
// ============================================================

#include "ChatController.h"

using namespace drogon;

void ChatController::initRoutes()
{
    app().registerHandler("/api/v1/chat", &ChatController::chat, {Post});
}

void ChatController::chat(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    auto json = req->getJsonObject();
    std::string msg = (json && json->isMember("message")) ? (*json)["message"].asString() : "";
    if (msg.empty())
    {
        Json::Value e; e["error"] = "message is required";
        auto resp = HttpResponse::newHttpJsonResponse(e);
        resp->setStatusCode(k400BadRequest); callback(resp); return;
    }
    std::string reply = "Azeem Mart bot: I can help with products, orders, and auth. LLM integration planned.";
    if (msg.find("hour") != std::string::npos) reply = "Azeem Mart bot: Open 9am-9pm.";
    else if (msg.find("return") != std::string::npos) reply = "Azeem Mart bot: Returns within 7 days with bill.";
    else if (msg.find("offer") != std::string::npos) reply = "Azeem Mart bot: Check /api/v1/products/search for deals.";
    Json::Value ok;
    ok["reply"] = reply;
    ok["echo"] = msg;
    auto resp = HttpResponse::newHttpJsonResponse(ok);
    callback(resp);
}
