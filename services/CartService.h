// ============================================================
// MODULE: CartService
// PURPOSE: In-memory shopping cart logic (stub for Week 2).
// WHY: Keeps cart rules out of controllers; DB migration planned.
// INPUT: userId + productId + quantity.
// OUTPUT: JSON cart arrays or error objects.
// ARCHITECTURE: Service
// ============================================================

#pragma once

#include <json/json.h>
#include <string>
#include <vector>
#include <map>
#include <mutex>
#include "../models/CartItem.h"

// Minimal cart: per-user item list stored in RAM.
// Planned: move to Postgres cart_items(user_id,product_id,qty).
class CartService
{
public:
    // Returns all items for a user.
    static Json::Value getCart(const std::string &userId);

    // Adds qty of product to user's cart. Returns item or error.
    static Json::Value addItem(const std::string &userId, const std::string &productId, int quantity);

    // Removes one product from user's cart. Returns true if removed.
    static bool removeItem(const std::string &userId, const std::string &productId);

    // Clears all items for a user (used after checkout).
    static void clearCart(const std::string &userId);

private:
    static std::map<std::string, std::vector<CartItem>> &getStorage();
    static std::mutex &getMutex();
};
