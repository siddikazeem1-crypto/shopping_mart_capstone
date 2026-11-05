// ============================================================
// MODULE: CartService
// PURPOSE: Implementation of in-memory cart stub.
// WHY: Week 2 Cart without DB yet; validates product exists.
// INPUT: userId, productId, quantity.
// OUTPUT: JSON cart or error.
// ARCHITECTURE: Service
// ============================================================

#include "CartService.h"
#include "ProductService.h"

// userId -> items
std::map<std::string, std::vector<CartItem>> &CartService::getStorage()
{
    static std::map<std::string, std::vector<CartItem>> carts;
    return carts;
}

std::mutex &CartService::getMutex()
{
    static std::mutex mtx;
    return mtx;
}

Json::Value CartService::getCart(const std::string &userId)
{
    std::lock_guard<std::mutex> lock(getMutex());
    Json::Value result(Json::arrayValue);
    auto it = getStorage().find(userId);
    if (it == getStorage().end())
    {
        return result;
    }
    for (auto &item : it->second)
    {
        result.append(item.toJson());
    }
    return result;
}

Json::Value CartService::addItem(const std::string &userId, const std::string &productId, int quantity)
{
    if (quantity <= 0)
    {
        Json::Value error;
        error["error"] = "Quantity must be >= 1";
        return error;
    }
    // Validate product exists via Postgres-backed service.
    auto product = ProductService::getProductById(productId);
    if (product.isNull())
    {
        Json::Value error;
        error["error"] = "Product not found";
        return error;
    }

    std::lock_guard<std::mutex> lock(getMutex());
    auto &items = getStorage()[userId];
    for (auto &item : items)
    {
        if (item.productId == productId)
        {
            item.quantity += quantity;
            return item.toJson();
        }
    }
    CartItem item;
    item.userId = userId;
    item.productId = productId;
    item.quantity = quantity;
    items.push_back(item);
    return item.toJson();
}

bool CartService::removeItem(const std::string &userId, const std::string &productId)
{
    std::lock_guard<std::mutex> lock(getMutex());
    auto it = getStorage().find(userId);
    if (it == getStorage().end())
    {
        return false;
    }
    auto &items = it->second;
    for (size_t i = 0; i < items.size(); i++)
    {
        if (items[i].productId == productId)
        {
            items.erase(items.begin() + i);
            return true;
        }
    }
    return false;
}

void CartService::clearCart(const std::string &userId)
{
    std::lock_guard<std::mutex> lock(getMutex());
    getStorage().erase(userId);
}
