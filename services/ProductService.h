// ============================================================
// MODULE: ProductService
// PURPOSE: Contains business logic for product operations.
// WHY: Controllers should call this service for all product data operations.
// INPUT: Product data from controllers.
// OUTPUT: JSON responses with product information from PostgreSQL.
// ARCHITECTURE: Service
// ============================================================

#pragma once

#include <drogon/drogon.h>
#include <json/json.h>
#include <libpq-fe.h>
#include <string>

// This class handles all product operations (CRUD) using PostgreSQL database directly via libpq.
class ProductService
{
public:
    // Connects to PostgreSQL and creates the products table.
    static bool initializeDatabase();

    // Returns all products from the database as a JSON array.
    static Json::Value getAllProducts();

    // Returns one product by its ID, or empty JSON if not found.
    static Json::Value getProductById(const std::string &id);

    // Creates a new product in the database and returns it.
    static Json::Value createProduct(const Json::Value &productData);

    // Updates an existing product and returns the updated version.
    static Json::Value updateProduct(const std::string &id, const Json::Value &productData);

    // Deletes a product by ID. Returns true if deleted, false if not found.
    static bool deleteProduct(const std::string &id);

    // Searches products by name substring + price range (Week 5 stub, in-RAM filter).
    static Json::Value searchProducts(const std::string &query, double minPrice, double maxPrice);

    // Builds connection string from environment variables (for Railway/Production)
    static std::string buildConnectionString();

private:
    // The PostgreSQL database connection.
    static PGconn *getConnection();

    // Generates a unique ID (UUID) for new products.
    static std::string generateUUID();

    // Frees a PGresult after use.
    static void freeResult(PGresult *res);
};
