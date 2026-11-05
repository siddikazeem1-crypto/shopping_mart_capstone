// ============================================================
// MODULE: ReviewService
// PURPOSE: Implementation of review stub.
// WHY: Validates rating + product exists.
// ARCHITECTURE: Service
// ============================================================

#include "ReviewService.h"
#include "ProductService.h"
#include <random>
#include <sstream>

std::vector<Review> &ReviewService::getStorage()
{
    static std::vector<Review> reviews;
    return reviews;
}

std::mutex &ReviewService::getMutex()
{
    static std::mutex mtx;
    return mtx;
}

std::string ReviewService::generateUUID()
{
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    std::stringstream ss;
    ss << std::hex;
    for (int i = 0; i < 8; i++) ss << dis(gen);
    return ss.str();
}

Json::Value ReviewService::getByProduct(const std::string &productId)
{
    std::lock_guard<std::mutex> lock(getMutex());
    Json::Value result(Json::arrayValue);
    for (auto &r : getStorage())
    {
        if (r.productId == productId) result.append(r.toJson());
    }
    return result;
}

Json::Value ReviewService::addReview(const std::string &productId, const std::string &userId, int rating, const std::string &comment)
{
    if (rating < 1 || rating > 5)
    {
        Json::Value e; e["error"] = "Rating must be 1-5";
        return e;
    }
    if (ProductService::getProductById(productId).isNull())
    {
        Json::Value e; e["error"] = "Product not found";
        return e;
    }
    std::lock_guard<std::mutex> lock(getMutex());
    Review r;
    r.id = generateUUID();
    r.productId = productId;
    r.userId = userId;
    r.rating = rating;
    r.comment = comment;
    getStorage().push_back(r);
    return r.toJson();
}
