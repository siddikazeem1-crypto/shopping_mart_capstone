// ============================================================
// MODULE: AdminController
// PURPOSE: Implementation of seller/admin stubs.
// WHY: Checks role from validateToken; counts from existing services.
// ARCHITECTURE: Controller
// ============================================================

#include "AdminController.h"
#include "../services/AuthService.h"
#include "../services/ProductService.h"

using namespace drogon;

static Json::Value authUserJson(const HttpRequestPtr &req)
{
    std::string h = req->getHeader("Authorization");
    std::string token = (h.empty() || h.find("Bearer ") != 0) ? "" : h.substr(7);
    if (token.empty()) return Json::Value();
    return AuthService::validateToken(token);
}

void AdminController::initRoutes()
{
    app().registerHandler("/api/v1/seller/stats", &AdminController::sellerStats, {Get});
    app().registerHandler("/api/v1/admin/stats", &AdminController::adminStats, {Get});
}

void AdminController::sellerStats(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    auto user = authUserJson(req);
    if (user.isNull() || user.isMember("error"))
    {
        Json::Value e; e["error"] = "Authorization header with Bearer token required";
        auto resp = HttpResponse::newHttpJsonResponse(e);
        resp->setStatusCode(k401Unauthorized); callback(resp); return;
    }
    // Stub: any logged user sees total products; per-seller ownership planned.
    auto products = ProductService::getAllProducts();
    Json::Value ok;
    ok["role"] = user.get("role", "customer").asString();
    ok["productCount"] = (int)products.size();
    ok["note"] = "Seller ownership filter planned";
    auto resp = HttpResponse::newHttpJsonResponse(ok);
    callback(resp);
}

void AdminController::adminStats(const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    auto user = authUserJson(req);
    if (user.isNull() || user.isMember("error"))
    {
        Json::Value e; e["error"] = "Authorization header with Bearer token required";
        auto resp = HttpResponse::newHttpJsonResponse(e);
        resp->setStatusCode(k401Unauthorized); callback(resp); return;
    }
    if (user.get("role", "customer").asString() != "admin")
    {
        Json::Value e; e["error"] = "Admin only";
        auto resp = HttpResponse::newHttpJsonResponse(e);
        resp->setStatusCode(k403Forbidden); callback(resp); return;
    }
    auto users = AuthService::getAllUsers();
    auto products = ProductService::getAllProducts();
    Json::Value ok;
    ok["userCount"] = (int)users.size();
    ok["productCount"] = (int)products.size();
    auto resp = HttpResponse::newHttpJsonResponse(ok);
    callback(resp);
}
