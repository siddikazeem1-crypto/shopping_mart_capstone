// ============================================================
// MODULE: AuthService
// PURPOSE: Contains business logic for user authentication.
// WHY: Controllers should call this service for login/register/token operations.
// INPUT: User data from controllers (username, email, password).
// OUTPUT: JSON responses with user info or authentication tokens.
// ARCHITECTURE: Service
// ============================================================

#pragma once

#include <drogon/drogon.h>
#include <json/json.h>
#include "../models/User.h"
#include <vector>
#include <mutex>

// This class handles user registration, login, and token validation.
// Think of it as the "security guard" that checks who you are.
class AuthService
{
public:
    // Registers a new user. Returns the user JSON or an error.
    static Json::Value registerUser(const Json::Value &userData);

    // Logs in a user. Returns a token on success, or an error.
    static Json::Value loginUser(const std::string &username, const std::string &password);

    // Validates a token and returns the user if valid.
    static Json::Value validateToken(const std::string &token);

    // Returns all users (admin use).
    static Json::Value getAllUsers();

    // Finds a user by ID.
    static Json::Value getUserById(const std::string &id);

    // Logs out a token. Returns true if token existed.
    static bool logoutToken(const std::string &token);

    // Returns user_id for a token, or empty string if invalid.
    static std::string getUserIdFromToken(const std::string &token);

private:
    // Generates a unique ID (UUID).
    static std::string generateUUID();

    // Simple password hashing (for demo; use bcrypt in production).
    static std::string hashPassword(const std::string &password);

    // Generates an authentication token.
    static std::string generateToken();

    // Returns the in-memory user storage.
    static std::vector<User> &getUserStorage();

    // Returns the in-memory token storage (token -> user_id mapping).
    static std::map<std::string, std::string> &getTokenStorage();

    // Returns a mutex for thread safety.
    static std::mutex &getMutex();
};
