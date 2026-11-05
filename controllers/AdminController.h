// ============================================================
// MODULE: AdminController
// PURPOSE: Seller dashboard + admin stubs (Weeks 3-4).
// WHY: Role-gated stats; real seller product ownership planned.
// INPUT: Bearer token.
// OUTPUT: JSON stats or 403.
// ARCHITECTURE: Controller
// ============================================================

#pragma once
#include <drogon/drogon.h>

class AdminController
{
public:
    // GET /api/v1/seller/stats -> own product count (stub).
    static void sellerStats(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    // GET /api/v1/admin/stats -> users + products counts (admin only stub).
    static void adminStats(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    static void initRoutes();
};
