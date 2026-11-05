// ============================================================
// MODULE: ReviewService
// PURPOSE: In-memory reviews stub (Week 6).
// WHY: Ratings validation 1-5; Postgres migration planned.
// INPUT: productId, userId, rating, comment.
// OUTPUT: JSON.
// ARCHITECTURE: Service
// ============================================================

#pragma once

#include <json/json.h>
#include <string>
#include <vector>
#include <mutex>
#include "../models/Review.h"

class ReviewService
{
public:
    static Json::Value getByProduct(const std::string &productId);
    static Json::Value addReview(const std::string &productId, const std::string &userId, int rating, const std::string &comment);

private:
    static std::vector<Review> &getStorage();
    static std::mutex &getMutex();
    static std::string generateUUID();
};
