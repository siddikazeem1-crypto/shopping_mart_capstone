// ============================================================
// MODULE: AuthService
// PURPOSE: Implementation of user authentication logic.
// WHY: Handles user registration, login, and token validation.
// INPUT: User data from controllers.
// OUTPUT: JSON responses with user info or authentication tokens.
// ARCHITECTURE: Service
// ============================================================

#include "AuthService.h"
#include <random>
#include <sstream>
#include <algorithm>
#include <map>

// Generates a unique ID (UUID) for new users.
std::string AuthService::generateUUID()
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

// Hashes a password using a simple XOR method.
// WARNING: This is for demo only. Use bcrypt in production.
std::string AuthService::hashPassword(const std::string &password)
{
    std::string hashed = password;
    for (auto &c : hashed)
    {
        c = c ^ 0x5A;
    }
    return hashed;
}

// Generates a random authentication token.
std::string AuthService::generateToken()
{
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);

    std::stringstream ss;
    for (int i = 0; i < 32; i++)
    {
        ss << std::hex << dis(gen);
    }
    return ss.str();
}

// Returns the in-memory user list.
// On first call, creates a default admin user (admin/admin123).
std::vector<User> &AuthService::getUserStorage()
{
    static std::vector<User> users;
    if (users.empty())
    {
        // Create default admin user
        User admin;
        admin.id = generateUUID();
        admin.username = "admin";
        admin.email = "admin@srimart.com";
        admin.password = hashPassword("admin123");
        admin.role = "admin";
        admin.created_at = "2026-08-13 12:00:00";
        admin.updated_at = "2026-08-13 12:00:00";
        users.push_back(admin);

        // Create default customer user
        User customer;
        customer.id = generateUUID();
        customer.username = "customer";
        customer.email = "customer@srimart.com";
        customer.password = hashPassword("customer123");
        customer.role = "customer";
        customer.created_at = "2026-08-13 12:00:00";
        customer.updated_at = "2026-08-13 12:00:00";
        users.push_back(customer);
    }
    return users;
}

// Returns the in-memory token storage (token -> user_id).
std::map<std::string, std::string> &AuthService::getTokenStorage()
{
    static std::map<std::string, std::string> tokens;
    return tokens;
}

// Returns a mutex to keep authentication operations safe.
std::mutex &AuthService::getMutex()
{
    static std::mutex mtx;
    return mtx;
}

// Registers a new user with username, email, and password.
// Returns the created user (without password) or an error.
Json::Value AuthService::registerUser(const Json::Value &userData)
{
    std::lock_guard<std::mutex> lock(getMutex());

    // Validate required fields
    if (!userData.isMember("username") || !userData.isMember("email") || !userData.isMember("password"))
    {
        Json::Value error;
        error["error"] = "Username, email, and password are required";
        return error;
    }

    std::string username = userData["username"].asString();
    std::string email = userData["email"].asString();
    std::string password = userData["password"].asString();

    // Check if username already exists
    for (auto &user : getUserStorage())
    {
        if (user.username == username)
        {
            Json::Value error;
            error["error"] = "Username already exists";
            return error;
        }
        if (user.email == email)
        {
            Json::Value error;
            error["error"] = "Email already registered";
            return error;
        }
    }

    // Create new user
    User user;
    user.id = generateUUID();
    user.username = username;
    user.email = email;
    user.password = hashPassword(password);
    user.role = userData.get("role", "customer").asString();
    user.created_at = "2026-08-13 12:00:00";
    user.updated_at = "2026-08-13 12:00:00";

    getUserStorage().push_back(user);

    // Return user without password
    return user.toJson();
}

// Logs in a user with username and password.
// Returns a token on success, or an error.
Json::Value AuthService::loginUser(const std::string &username, const std::string &password)
{
    std::lock_guard<std::mutex> lock(getMutex());

    std::string hashedPassword = hashPassword(password);

    for (auto &user : getUserStorage())
    {
        if (user.username == username && user.password == hashedPassword)
        {
            // Generate token and store it
            std::string token = generateToken();
            getTokenStorage()[token] = user.id;

            Json::Value result;
            result["token"] = token;
            result["user"] = user.toJson();
            return result;
        }
    }

    Json::Value error;
    error["error"] = "Invalid username or password";
    return error;
}

// Validates an authentication token.
// Returns the user if token is valid, or an error.
Json::Value AuthService::validateToken(const std::string &token)
{
    std::lock_guard<std::mutex> lock(getMutex());

    auto &tokens = getTokenStorage();
    if (tokens.find(token) != tokens.end())
    {
        std::string userId = tokens[token];
        for (auto &user : getUserStorage())
        {
            if (user.id == userId)
            {
                return user.toJson();
            }
        }
    }

    Json::Value error;
    error["error"] = "Invalid or expired token";
    return error;
}

// Returns all users (without passwords).
Json::Value AuthService::getAllUsers()
{
    std::lock_guard<std::mutex> lock(getMutex());
    Json::Value result(Json::arrayValue);
    for (auto &user : getUserStorage())
    {
        result.append(user.toJson());
    }
    return result;
}

// Finds a user by ID.
Json::Value AuthService::getUserById(const std::string &id)
{
    std::lock_guard<std::mutex> lock(getMutex());
    for (auto &user : getUserStorage())
    {
        if (user.id == id)
        {
            return user.toJson();
        }
    }
    Json::Value error;
    error["error"] = "User not found";
    return error;
}

// Logs out a token by erasing it from token storage.
bool AuthService::logoutToken(const std::string &token)
{
    std::lock_guard<std::mutex> lock(getMutex());
    auto &tokens = getTokenStorage();
    auto it = tokens.find(token);
    if (it != tokens.end())
    {
        tokens.erase(it);
        return true;
    }
    return false;
}

// Returns user_id for a token, or empty string if invalid.
std::string AuthService::getUserIdFromToken(const std::string &token)
{
    std::lock_guard<std::mutex> lock(getMutex());
    auto &tokens = getTokenStorage();
    auto it = tokens.find(token);
    if (it != tokens.end())
    {
        return it->second;
    }
    return "";
}
