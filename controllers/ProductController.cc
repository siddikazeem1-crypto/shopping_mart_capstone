// ============================================================
// MODULE: ProductController
// PURPOSE: Implementation of product HTTP request handlers.
// WHY: Defines how product API endpoints respond to requests.
// INPUT: HTTP requests with product data.
// OUTPUT: JSON responses with product information.
// ARCHITECTURE: Controller
// ============================================================

#include "ProductController.h"
#include "../services/ProductService.h"

using namespace drogon;

// Registers all product routes with the Drogon server.
// Each route maps a URL + HTTP method to a function.
void ProductController::initRoutes()
{
    // GET /api/v1/products -> returns all products
    app().registerHandler("/api/v1/products",
        &ProductController::getProducts,
        {Get});

    // POST /api/v1/products -> creates a new product
    app().registerHandler("/api/v1/products",
        &ProductController::createProduct,
        {Post});

    // GET /api/v1/products/{id} -> returns one product
    app().registerHandler("/api/v1/products/{id}",
        &ProductController::getProductById,
        {Get});

    // PUT /api/v1/products/{id} -> updates a product
    app().registerHandler("/api/v1/products/{id}",
        &ProductController::updateProduct,
        {Put});

    // DELETE /api/v1/products/{id} -> deletes a product
    app().registerHandler("/api/v1/products/{id}",
        &ProductController::deleteProduct,
        {Delete});

    // GET /api/v1/products/search?q=&minPrice=&maxPrice= -> search/filter
    app().registerHandler("/api/v1/products/search",
        &ProductController::searchProducts,
        {Get});
}

// Fetches all products from the service and returns them as JSON.
void ProductController::getProducts(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    auto products = ProductService::getAllProducts();
    auto resp = HttpResponse::newHttpJsonResponse(products);
    callback(resp);
}

// Reads the JSON body from the request, validates it, and creates a product.
// Returns 401 if name or price is missing.
void ProductController::createProduct(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    auto json = req->getJsonObject();
    if (!json || !json->isMember("name") || !json->isMember("price"))
    {
        Json::Value error;
        error["error"] = "Name and price are required";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k400BadRequest);
        callback(resp);
        return;
    }
    auto result = ProductService::createProduct(*json);
    auto resp = HttpResponse::newHttpJsonResponse(result);
    resp->setStatusCode(k201Created);
    callback(resp);
}

// Finds one product by its ID. Returns 404 if not found.
void ProductController::getProductById(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback,
    std::string productId)
{
    auto product = ProductService::getProductById(productId);
    if (product.isNull())
    {
        Json::Value error;
        error["error"] = "Product not found";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k404NotFound);
        callback(resp);
    }
    else
    {
        auto resp = HttpResponse::newHttpJsonResponse(product);
        callback(resp);
    }
}

// Updates an existing product with new data from the request body.
// Returns 404 if the product doesn't exist.
void ProductController::updateProduct(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback,
    std::string productId)
{
    auto json = req->getJsonObject();
    if (!json)
    {
        Json::Value error;
        error["error"] = "Invalid request body";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k400BadRequest);
        callback(resp);
        return;
    }
    auto result = ProductService::updateProduct(productId, *json);
    if (result.isNull())
    {
        Json::Value error;
        error["error"] = "Product not found";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k404NotFound);
        callback(resp);
    }
    else
    {
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);
    }
}

// Deletes a product by its ID. Returns 404 if not found.
void ProductController::deleteProduct(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback,
    std::string productId)
{
    bool deleted = ProductService::deleteProduct(productId);
    if (deleted)
    {
        Json::Value json;
        json["message"] = "Product deleted successfully";
        auto resp = HttpResponse::newHttpJsonResponse(json);
        callback(resp);
    }
    else
    {
        Json::Value error;
        error["error"] = "Product not found";
        auto resp = HttpResponse::newHttpJsonResponse(error);
        resp->setStatusCode(k404NotFound);
        callback(resp);
    }
}

// Searches products by query params: q, minPrice, maxPrice.
void ProductController::searchProducts(
    const HttpRequestPtr &req,
    std::function<void(const HttpResponsePtr &)> &&callback)
{
    std::string q = req->getParameter("q");
    std::string minS = req->getParameter("minPrice");
    std::string maxS = req->getParameter("maxPrice");
    double minPrice = minS.empty() ? -1 : std::stod(minS);
    double maxPrice = maxS.empty() ? -1 : std::stod(maxS);
    auto result = ProductService::searchProducts(q, minPrice, maxPrice);
    auto resp = HttpResponse::newHttpJsonResponse(result);
    callback(resp);
}
