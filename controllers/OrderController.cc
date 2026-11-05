// ============================================================
// MODULE: OrderController
// PURPOSE: Implementation of order HTTP handlers.
// WHY: Checkout + list + status update.
// INPUT: Bearer token.
// OUTPUT: JSON.
// ARCHITECTURE: Controller
// ============================================================

#include "OrderController.h"
#include "../services/OrderService.h"
#include "../services/AuthService.h"

using namespace drogon;

static std::string getBearer(const HttpRequestPtr &req)
{
    std::string h = req->getHeader("Authorization");
    if (h.empty() || h.find("Bearer ") != 0) return "";
    return h.substr(7);
}

static std::string authUser(const HttpRequestPtr &req)
{
    std::string t = getBearer(req);
    return t.empty() ? "" : AuthService::getUserIdFromToken(t);
}

void OrderController::initRoutes()
{
    app().registerHandler("/api/v1/orders/checkout", &OrderController::checkout, {Post});
    app().registerHandler("/api/v1/orders", &OrderController::listOrders, {Get});
    app().registerHandler("/api/v1/orders/{id}", &OrderController::getOrder, {Get});
    app().registerHandler("/api/v1/orders/{id}/status", &OrderController::updateStatus, {Put});
}

void OrderController::checkout(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    std::string userId = authUser(req);
    if (userId.empty())
    {
        Json::Value error; error["error"] = "Authorization header with Bearer token required";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k401Unauthorized); callback(resp); return;
    }
    auto result = OrderService::checkout(userId);
    if (result.isMember("error"))
    {
        auto resp = HttpResponse::newHttpJsonResponse(result);
        resp->setStatusCode(k400BadRequest); callback(resp);
    }
    else
    {
        auto resp = HttpResponse::newHttpJsonResponse(result);
        resp->setStatusCode(k201Created); callback(resp);
    }
}

void OrderController::listOrders(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    std::string userId = authUser(req);
    if (userId.empty())
    {
        Json::Value error; error["error"] = "Authorization header with Bearer token required";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k401Unauthorized); callback(resp); return;
    }
    auto resp = HttpResponse::newHttpJsonResponse(OrderService::getOrders(userId));
    callback(resp);
}

void OrderController::getOrder(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback, std::string orderId)
{
    std::string userId = authUser(req);
    if (userId.empty())
    {
        Json::Value error; error["error"] = "Authorization header with Bearer token required";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k401Unauthorized); callback(resp); return;
    }
    auto order = OrderService::getOrderById(userId, orderId);
    if (order.isNull())
    {
        Json::Value error; error["error"] = "Order not found";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k404NotFound); callback(resp);
    }
    else
    {
        auto resp = HttpResponse::newHttpJsonResponse(order);
        callback(resp);
    }
}

void OrderController::updateStatus(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback, std::string orderId)
{
    std::string userId = authUser(req);
    if (userId.empty())
    {
        Json::Value error; error["error"] = "Authorization header with Bearer token required";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k401Unauthorized); callback(resp); return;
    }
    auto json = req->getJsonObject();
    std::string status = (json && json->isMember("status")) ? (*json)["status"].asString() : "";
    auto result = OrderService::updateStatus(userId, orderId, status);
    if (result.isNull())
    {
        Json::Value error; error["error"] = "Order not found";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k404NotFound); callback(resp);
    }
    else if (result.isMember("error"))
    {
        auto resp = HttpResponse::newHttpJsonResponse(result);
        resp->setStatusCode(k400BadRequest); callback(resp);
    }
    else
    {
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);
    }
}
