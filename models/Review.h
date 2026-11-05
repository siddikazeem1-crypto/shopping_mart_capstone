// ============================================================
// MODULE: Review
// PURPOSE: Product review stub (Week 6).
// WHY: Ratings + comments per product.
// INPUT: productId, userId, rating 1-5, comment.
// OUTPUT: JSON review.
// ARCHITECTURE: Model
// ============================================================

#pragma once

#include <string>
#include <drogon/drogon.h>

struct Review
{
    std::string id;
    std::string productId;
    std::string userId;
    int rating; // 1-5
    std::string comment;

    Review() : rating(5) {}

    Json::Value toJson() const
    {
        Json::Value j;
        j["id"] = id;
        j["productId"] = productId;
        j["userId"] = userId;
        j["rating"] = rating;
        j["comment"] = comment;
        return j;
    }
};
