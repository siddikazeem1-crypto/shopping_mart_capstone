// ============================================================
// MODULE: Order
// PURPOSE: Represents a billing order stub (Week 2 + Week 5 status).
// WHY: Checkout needs id, owner, items, total, status.
// INPUT: Checkout data.
// OUTPUT: JSON order.
// ARCHITECTURE: Model
// ============================================================

#pragma once

#include <string>
#include <drogon/drogon.h>

// Minimal order: id, owner, total, status, item count.
struct Order
{
    std::string id;        // UUID
    std::string userId;    // Owner
    double total;          // Sum(price*qty) stub (0 if price lookup fails)
    std::string status;    // e.g. created, paid, shipped
    int itemCount;         // Number of lines
    std::string created_at;

    Order() : total(0.0), status("created"), itemCount(0) {}

    Json::Value toJson() const
    {
        Json::Value json;
        json["id"] = id;
        json["userId"] = userId;
        json["total"] = total;
        json["status"] = status;
        json["itemCount"] = itemCount;
        json["created_at"] = created_at;
        return json;
    }
};
