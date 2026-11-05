// ============================================================
// MODULE: OrderService
// PURPOSE: In-memory checkout/billing stub + order status.
// WHY: Week 2 checkout + Week 5 status without Postgres yet.
// INPUT: userId (cart owner).
// OUTPUT: JSON orders.
// ARCHITECTURE: Service
// ============================================================

#pragma once

#include <json/json.h>
#include <string>
#include <vector>
#include <mutex>
#include "../models/Order.h"

// Stub billing: totals computed from ProductService prices when available.
class OrderService
{
public:
    // Checkout user's cart -> creates order, clears cart.
    static Json::Value checkout(const std::string &userId);

    // Lists orders for a user.
    static Json::Value getOrders(const std::string &userId);

    // Gets one order if owned by user.
    static Json::Value getOrderById(const std::string &userId, const std::string &orderId);

    // Updates status (created/paid/shipped). Returns order or error.
    static Json::Value updateStatus(const std::string &userId, const std::string &orderId, const std::string &status);

private:
    static std::vector<Order> &getStorage();
    static std::mutex &getMutex();
    static std::string generateUUID();
};
