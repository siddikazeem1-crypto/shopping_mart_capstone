// ============================================================
// MODULE: ProductService
// PURPOSE: Implementation of product business logic using PostgreSQL via libpq.
// WHY: Handles all database operations for products.
// INPUT: Product data from controllers.
// OUTPUT: JSON responses with product information.
// ARCHITECTURE: Service
// ============================================================

#include "ProductService.h"
#include <random>
#include <sstream>
#include <iostream>
#include <cstdlib>
#include <regex>

// The PostgreSQL connection (shared across all operations).
static PGconn *g_conn = nullptr;

// Builds PostgreSQL connection string from environment variables.
// Priority: DATABASE_URL (Railway) > individual DB_* vars > localhost defaults.
std::string ProductService::buildConnectionString()
{
    // Railway provides DATABASE_URL in format: postgresql://user:password@host:port/database
    const char *databaseUrl = std::getenv("DATABASE_URL");
    if (databaseUrl && std::strlen(databaseUrl) > 0)
    {
        return std::string(databaseUrl);
    }

    // Fallback to individual environment variables
    std::string host = std::getenv("DB_HOST") ? std::getenv("DB_HOST") : "localhost";
    std::string port = std::getenv("DB_PORT") ? std::getenv("DB_PORT") : "5432";
    std::string dbname = std::getenv("DB_NAME") ? std::getenv("DB_NAME") : "sanghavi_mart";
    std::string user = std::getenv("DB_USER") ? std::getenv("DB_USER") : "postgres";
    std::string password = std::getenv("DB_PASSWORD") ? std::getenv("DB_PASSWORD") : "postgres";

    std::stringstream ss;
    ss << "host=" << host
       << " port=" << port
       << " dbname=" << dbname
       << " user=" << user
       << " password=" << password;
    return ss.str();
}

// Returns the PostgreSQL connection.
// Creates a new connection if one doesn't exist.
PGconn *ProductService::getConnection()
{
    if (g_conn == nullptr || PQstatus(g_conn) != CONNECTION_OK)
    {
        if (g_conn != nullptr)
        {
            PQfinish(g_conn);
        }
        std::string connStr = buildConnectionString();
        g_conn = PQconnectdb(connStr.c_str());
        if (PQstatus(g_conn) != CONNECTION_OK)
        {
            LOG_ERROR << "PostgreSQL connection failed: " << PQerrorMessage(g_conn);
            g_conn = nullptr;
        }
        else
        {
            LOG_INFO << "Connected to PostgreSQL database";
        }
    }
    return g_conn;
}

// Frees a PGresult after use (prevents memory leaks).
void ProductService::freeResult(PGresult *res)
{
    if (res != nullptr)
    {
        PQclear(res);
    }
}

// Generates a unique ID (UUID) for new products.
std::string ProductService::generateUUID()
{
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    static std::uniform_int_distribution<> dis2(8, 11);

    std::stringstream ss;
    ss << std::hex;
    for (int i = 0; i < 8; i++) ss << dis(gen);
    ss << "-";
    for (int i = 0; i < 4; i++) ss << dis(gen);
    ss << "-4";
    for (int i = 0; i < 3; i++) ss << dis(gen);
    ss << "-";
    ss << dis2(gen);
    for (int i = 0; i < 3; i++) ss << dis(gen);
    ss << "-";
    for (int i = 0; i < 12; i++) ss << dis(gen);
    return ss.str();
}

// Creates the products table in PostgreSQL if it doesn't exist.
bool ProductService::initializeDatabase()
{
    PGconn *conn = getConnection();
    if (conn == nullptr)
    {
        return false;
    }

    const char *query =
        "CREATE TABLE IF NOT EXISTS products ("
        "id VARCHAR(36) PRIMARY KEY,"
        "name VARCHAR(255) NOT NULL,"
        "description TEXT DEFAULT '',"
        "price DECIMAL(10,2) NOT NULL,"
        "stock INTEGER DEFAULT 0,"
        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";

    PGresult *res = PQexec(conn, query);
    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        LOG_ERROR << "Create table failed: " << PQerrorMessage(conn);
        freeResult(res);
        return false;
    }

    LOG_INFO << "Products table created/verified in PostgreSQL.";
    freeResult(res);
    return true;
}

// Returns all products from the PostgreSQL database.
Json::Value ProductService::getAllProducts()
{
    Json::Value result(Json::arrayValue);
    PGconn *conn = getConnection();
    if (conn == nullptr)
    {
        return result;
    }

    PGresult *res = PQexec(conn,
        "SELECT id, name, description, price, stock, "
        "created_at::text, updated_at::text FROM products");

    if (PQresultStatus(res) != PGRES_TUPLES_OK)
    {
        LOG_ERROR << "Get products failed: " << PQerrorMessage(conn);
        freeResult(res);
        return result;
    }

    int rows = PQntuples(res);
    int cols = PQnfields(res);

    for (int i = 0; i < rows; i++)
    {
        Json::Value item;
        item["id"] = PQgetvalue(res, i, 0);
        item["name"] = PQgetvalue(res, i, 1);
        item["description"] = PQgetvalue(res, i, 2);
        item["price"] = std::stod(PQgetvalue(res, i, 3));
        item["stock"] = std::stoi(PQgetvalue(res, i, 4));
        item["created_at"] = PQgetvalue(res, i, 5);
        item["updated_at"] = PQgetvalue(res, i, 6);
        result.append(item);
    }

    freeResult(res);
    return result;
}

// Finds one product by its ID in the PostgreSQL database.
Json::Value ProductService::getProductById(const std::string &id)
{
    PGconn *conn = getConnection();
    if (conn == nullptr)
    {
        return Json::Value();
    }

    const char *paramValues[1] = {id.c_str()};

    PGresult *res = PQexecParams(conn,
        "SELECT id, name, description, price, stock, "
        "created_at::text, updated_at::text "
        "FROM products WHERE id = $1",
        1,       // number of parameters
        nullptr, // param types (let PostgreSQL infer)
        paramValues, // param values
        nullptr, // param lengths (text doesn't need this)
        nullptr, // param formats (all text)
        0        // result format (text)
    );

    if (PQresultStatus(res) != PGRES_TUPLES_OK)
    {
        LOG_ERROR << "Get product failed: " << PQerrorMessage(conn);
        freeResult(res);
        return Json::Value();
    }

    if (PQntuples(res) > 0)
    {
        Json::Value item;
        item["id"] = PQgetvalue(res, 0, 0);
        item["name"] = PQgetvalue(res, 0, 1);
        item["description"] = PQgetvalue(res, 0, 2);
        item["price"] = std::stod(PQgetvalue(res, 0, 3));
        item["stock"] = std::stoi(PQgetvalue(res, 0, 4));
        item["created_at"] = PQgetvalue(res, 0, 5);
        item["updated_at"] = PQgetvalue(res, 0, 6);
        freeResult(res);
        return item;
    }

    freeResult(res);
    return Json::Value();
}

// Creates a new product in the PostgreSQL database.
Json::Value ProductService::createProduct(const Json::Value &productData)
{
    PGconn *conn = getConnection();
    if (conn == nullptr)
    {
        Json::Value error;
        error["error"] = "Database connection failed";
        return error;
    }

    std::string id = generateUUID();
    std::string name = productData["name"].asString();
    std::string description = productData.get("description", "").asString();
    std::string price = std::to_string(productData["price"].asDouble());
    std::string stock = std::to_string(productData.get("stock", 0).asInt());

    const char *paramValues[5] = {id.c_str(), name.c_str(), description.c_str(), price.c_str(), stock.c_str()};

    PGresult *res = PQexecParams(conn,
        "INSERT INTO products (id, name, description, price, stock) "
        "VALUES ($1, $2, $3, $4::decimal, $5::integer)",
        5, nullptr, paramValues, nullptr, nullptr, 0);

    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        LOG_ERROR << "Create product failed: " << PQerrorMessage(conn);
        freeResult(res);
        Json::Value error;
        error["error"] = "Failed to create product";
        return error;
    }

    freeResult(res);
    return getProductById(id);
}

// Updates an existing product in the PostgreSQL database.
Json::Value ProductService::updateProduct(const std::string &id, const Json::Value &productData)
{
    PGconn *conn = getConnection();
    if (conn == nullptr)
    {
        return Json::Value();
    }

    // Check if product exists
    const char *checkParams[1] = {id.c_str()};
    PGresult *checkRes = PQexecParams(conn,
        "SELECT id FROM products WHERE id = $1",
        1, nullptr, checkParams, nullptr, nullptr, 0);

    if (PQresultStatus(checkRes) != PGRES_TUPLES_OK || PQntuples(checkRes) == 0)
    {
        freeResult(checkRes);
        return Json::Value();
    }
    freeResult(checkRes);

    // Update the product
    std::string name = productData.get("name", "").asString();
    std::string description = productData.get("description", "").asString();
    std::string price = std::to_string(productData.get("price", 0.0).asDouble());
    std::string stock = std::to_string(productData.get("stock", 0).asInt());

    const char *paramValues[5] = {name.c_str(), description.c_str(), price.c_str(), stock.c_str(), id.c_str()};

    PGresult *res = PQexecParams(conn,
        "UPDATE products SET name = $1, description = $2, "
        "price = $3::decimal, stock = $4::integer, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = $5",
        5, nullptr, paramValues, nullptr, nullptr, 0);

    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        LOG_ERROR << "Update product failed: " << PQerrorMessage(conn);
        freeResult(res);
        return Json::Value();
    }

    freeResult(res);
    return getProductById(id);
}

// Deletes a product from the PostgreSQL database.
bool ProductService::deleteProduct(const std::string &id)
{
    PGconn *conn = getConnection();
    if (conn == nullptr)
    {
        return false;
    }

    const char *paramValues[1] = {id.c_str()};
    PGresult *res = PQexecParams(conn,
        "DELETE FROM products WHERE id = $1",
        1, nullptr, paramValues, nullptr, nullptr, 0);

    if (PQresultStatus(res) != PGRES_COMMAND_OK)
    {
        LOG_ERROR << "Delete product failed: " << PQerrorMessage(conn);
        freeResult(res);
        return false;
    }

    bool deleted = (PQcmdTuples(res)[0] != '0');
    freeResult(res);
    return deleted;
}

// Searches products by case-sensitive name substring + price range.
// Stub: loads all then filters in RAM (Week 5). Planned: SQL WHERE ILIKE.
Json::Value ProductService::searchProducts(const std::string &query, double minPrice, double maxPrice)
{
    Json::Value all = getAllProducts();
    Json::Value result(Json::arrayValue);
    for (auto &item : all)
    {
        std::string name = item.get("name", "").asString();
        double price = item.get("price", 0.0).asDouble();
        if (!query.empty() && name.find(query) == std::string::npos)
        {
            continue;
        }
        if (minPrice >= 0 && price < minPrice)
        {
            continue;
        }
        if (maxPrice >= 0 && price > maxPrice)
        {
            continue;
        }
        result.append(item);
    }
    return result;
}
