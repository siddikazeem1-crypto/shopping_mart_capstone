// ============================================================
// MODULE: OrderService
// PURPOSE: Implementation of checkout stub.
// WHY: Sums cart into an order; real stock decrement planned in Postgres.
// INPUT: userId.
// OUTPUT: JSON order or error.
// ARCHITECTURE: Service
// ============================================================

#include "OrderService.h"
#include "CartService.h"
#include "ProductService.h"
#include <random>
#include <sstream>

std::vector<Order> &OrderService::getStorage()
{
    static std::vector<Order> orders;
    return orders;
}

std::mutex &OrderService::getMutex()
{
    static std::mutex mtx;
    return mtx;
}

std::string OrderService::generateUUID()
{
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    std::stringstream ss;
    ss << std::hex;
    for (int i = 0; i < 8; i++) ss << dis(gen);
    ss << "-";
    for (int i = 0; i < 4; i++) ss << dis(gen);
    ss << "-4";
    for (int i = 0; i < 3; i++) ss << dis(gen);
    ss << "-";
    for (int i = 0; i < 12; i++) ss << dis(gen);
    return ss.str();
}

Json::Value OrderService::checkout(const std::string &userId)
{
    auto cart = CartService::getCart(userId);
    if (cart.size() == 0)
    {
        Json::Value error;
        error["error"] = "Cart is empty";
        return error;
    }
    double total = 0.0;
    for (auto &line : cart)
    {
        auto product = ProductService::getProductById(line["productId"].asString());
        double price = product.isNull() ? 0.0 : product.get("price", 0.0).asDouble();
        total += price * line.get("quantity", 1).asInt();
    }

    std::lock_guard<std::mutex> lock(getMutex());
    Order order;
    order.id = generateUUID();
    order.userId = userId;
    order.total = total;
    order.status = "created";
    order.itemCount = (int)cart.size();
    order.created_at = "2026-09-21 00:00:00";
    getStorage().push_back(order);

    // Clear cart after successful billing stub.
    CartService::clearCart(userId);
    return order.toJson();
}

Json::Value OrderService::getOrders(const std::string &userId)
{
    std::lock_guard<std::mutex> lock(getMutex());
    Json::Value result(Json::arrayValue);
    for (auto &o : getStorage())
    {
        if (o.userId == userId)
        {
            result.append(o.toJson());
        }
    }
    return result;
}

Json::Value OrderService::getOrderById(const std::string &userId, const std::string &orderId)
{
    std::lock_guard<std::mutex> lock(getMutex());
    for (auto &o : getStorage())
    {
        if (o.id == orderId && o.userId == userId)
        {
            return o.toJson();
        }
    }
    return Json::Value();
}

Json::Value OrderService::updateStatus(const std::string &userId, const std::string &orderId, const std::string &status)
{
    if (status != "created" && status != "paid" && status != "shipped")
    {
        Json::Value error;
        error["error"] = "Status must be created, paid, or shipped";
        return error;
    }
    std::lock_guard<std::mutex> lock(getMutex());
    for (auto &o : getStorage())
    {
        if (o.id == orderId && o.userId == userId)
        {
            o.status = status;
            return o.toJson();
        }
    }
    return Json::Value();
}
