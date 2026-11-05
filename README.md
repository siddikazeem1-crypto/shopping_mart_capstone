# Azeem Mart — E-Commerce Backend API

A C++20 backend API for an e-commerce store, built with Drogon and PostgreSQL. Handles user authentication and product management with a clean layered architecture.

## Tech Stack

- **Language:** C++20
- **Framework:** Drogon (HTTP server + JSON)
- **Database:** PostgreSQL (via libpq)
- **Build:** CMake + vcpkg (Docker multi-stage build for Railway)
- **Frontend:** Static HTML login page served at `/`
- **Deployment:** Railway (Docker)

## Features

- User registration, login with token auth, token validation
- Product CRUD (create, list, get by id, update, delete) persisted in PostgreSQL
- Health check and hello test endpoints
- Login/Register web UI with token storage in localStorage

## Project Structure

```text
sanghavi-mart/
├── sri.cpp                  # App entry point, route registration
├── CMakeLists.txt           # Build config, target sri_mart
├── Dockerfile               # Multi-stage Docker build for Railway
├── railway.toml             # Railway deployment config
├── .dockerignore            # Docker build exclusions
├── .env.example             # Environment variables template
├── controllers/             # HTTP layer: AuthController, ProductController
├── services/                # Business logic: AuthService, ProductService
├── models/                  # Data structs: User, Product
├── config/
│   ├── drogon.json          # Listener + log config
│   └── login.html           # Login/Register UI
├── start.bat / dev.bat / stop.bat
└── ARCHITECTURE.md
```

Architecture flow: `Client -> Drogon routes -> Controller -> Service -> Model/DB -> JSON response`

## API Endpoints

### Health & UI
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/` | Login page (HTML) |
| GET | `/api/v1/health` | `{"status":"UP"}` |
| GET | `/api/v1/hello` | `{"message":"Welcome to Azeem Mart API"}` |

### Auth
| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/api/v1/auth/register` | `{username,email,password}` -> 201 user |
| POST | `/api/v1/auth/login` | `{username,password}` -> `{token,user}` |
| GET | `/api/v1/auth/validate` | `Authorization: Bearer <token>` -> user |
| GET | `/api/v1/auth/users` | List users (no passwords) |

### Products
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/v1/products` | List all |
| POST | `/api/v1/products` | `{name,price,description?,stock?}` |
| GET | `/api/v1/products/{id}` | Get one |
| PUT | `/api/v1/products/{id}` | Update |
| DELETE | `/api/v1/products/{id}` | Delete |

## Getting Started

### Local Development (Windows)

#### Prerequisites
- MSYS2 UCRT64 (MinGW), CMake, vcpkg with Drogon installed
- PostgreSQL running with database `sanghavi_mart` (default expects `localhost:5433`, user `postgres`)

#### Build
```cmd
cmake -B build -S . -G "MinGW Makefiles" -DCMAKE_TOOLCHAIN_FILE="C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" -DVCPKG_TARGET_TRIPLET=x64-mingw-dynamic
cmake --build build
```

#### Run
```cmd
cd build
sri_mart.exe
```
Open `http://localhost:8080`

You should see:
```
Connected to PostgreSQL database
Products table created/verified in PostgreSQL.
Azeem Mart API running on http://0.0.0.0:8080
```

Or use `start.bat` / `dev.bat` for quick start, `stop.bat` to stop PostgreSQL.

### Local Development with Docker

```bash
# Build image
docker build -t sanghavi-mart .

# Run with local PostgreSQL (adjust host.docker.internal for your OS)
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5433 \
  -e DB_NAME=sanghavi_mart \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  sanghavi-mart
```

### Test with cURL
```bash
curl http://localhost:8080/api/v1/health
curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d "{\"username\":\"test\",\"email\":\"test@test.com\",\"password\":\"test123\"}"
curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
curl http://localhost:8080/api/v1/products
curl -X POST http://localhost:8080/api/v1/products -H "Content-Type: application/json" -d "{\"name\":\"Phone\",\"price\":699.99,\"stock\":25}"
```

Default accounts: `admin / admin123 (admin)`, `customer / customer123 (customer)`

## Railway Deployment

### Quick Deploy

1. **Push to GitHub** (or connect your repo directly to Railway)

2. **Create new Railway project** → "Deploy from GitHub repo"

3. **Add PostgreSQL plugin** in Railway dashboard:
   - Click "New" → "Database" → "PostgreSQL"
   - This automatically provides `DATABASE_URL` environment variable

4. **Deploy** - Railway will:
   - Detect `Dockerfile` and `railway.toml`
   - Build the multi-stage Docker image
   - Set `PORT` environment variable automatically
   - Connect to PostgreSQL via `DATABASE_URL`

### Environment Variables (set in Railway dashboard)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | HTTP port (set automatically by Railway) | Auto |
| `DATABASE_URL` | PostgreSQL connection string (set by Railway PostgreSQL plugin) | Auto |

No manual environment variables needed if using Railway's PostgreSQL plugin!

### Manual Railway Setup (without plugin)

If not using Railway's PostgreSQL plugin, set these variables:
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

## Vercel Deployment (Frontend)

> Vercel cannot run C++ Drogon servers. Only Node/Python/Go serverless + static.
> Pattern used here: UI on Vercel, C++ API stays on Railway, `/api/*` proxied.

Architecture:
```text
Browser -> https://your-app.vercel.app/ (static login.html)
        -> https://your-app.vercel.app/api/v1/... (rewrite proxy)
        -> https://YOUR-RAILWAY-URL.up.railway.app/api/v1/... (C++ Drogon)
```

### Steps

1. **Deploy backend to Railway first** (see above), copy your Railway URL:
   `https://xxxx.up.railway.app` — test `https://xxxx.up.railway.app/api/v1/health` returns `{"status":"UP"}`

2. **Update `vercel.json`** — replace `REPLACE-WITH-RAILWAY-URL` with your Railway URL:
   ```json
   {
     "source": "/api/:path*",
     "destination": "https://xxxx.up.railway.app/api/:path*"
   }
   ```
   Commit + push.

3. **Import to Vercel**:
   - vercel.com → Add New → Project → Import `sanghavineha15-bit/Sanghavi_Mart`
   - Framework Preset: `Other`, Root Directory: `./`, no build command needed
   - Deploy — Vercel serves `config/login.html` at `/`

4. **Test**:
   - `https://your-app.vercel.app/` → login UI
   - `https://your-app.vercel.app/api/v1/health` → `{"status":"UP"}` (proxied to Railway)

Frontend uses relative `API_BASE = ''` (`config/login.html:77`), so same code works locally (Drogon serves `/`) and on Vercel (rewrite proxy). No CORS needed.

## Notes

- Products are persisted in PostgreSQL `products` table (auto-created on startup).
- Auth storage is currently in-memory; moving to PostgreSQL + hashed passwords with bcrypt is planned.
- See `ARCHITECTURE.md` for layer details and `config/drogon.json` for port/log config.
- Docker multi-stage build keeps final image small (~100MB).
