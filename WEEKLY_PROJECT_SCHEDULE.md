# Weekly Project Schedule — Azeem Mart

Planned 11-week build + Final Review on September 21, 2026.

| Week | Dates | Main Work | Status on Sep 21, 2026 |
|------|-------|-----------|------------------------|
| Week 1 | Jul 6 – Jul 12 | Authentication + project/repository foundation | Done — register/login/token, repo layout, Drogon + PostgreSQL base |
| Week 2 | Jul 13 – Jul 19 | Browse + Cart + Checkout/Order | Planned — current API has Product list/get only |
| Week 3 | Jul 20 – Jul 26 | Review fixes + Seller dashboard | Planned |
| Week 4 | Jul 27 – Aug 2 | Seller dashboard + Admin | Planned |
| Week 5 | Aug 3 – Aug 9 | Search/filter + Order status | Planned |
| Week 6 | Aug 10 – Aug 16 | Reviews + ratings + validation | Planned |
| Week 7 | Aug 17 – Aug 23 | Security + testing + sanitizers | Planned — auth is in-memory, bcrypt/Postgres migration pending |
| Week 8 | Aug 24 – Aug 30 | Deployment + cloud testing | Planned |
| Week 9 | Aug 31 – Sep 6 | AI chatbot integration | Planned |
| Week 10 | Sep 7 – Sep 13 | Chatbot refinement + UI + documentation | Planned — current UI is static login page at `/` |
| Week 11 | Sep 14 – Sep 21 | Final testing + report + PPT + rehearsal | In progress — this repo state is the demo baseline |
| Final Review | September 21, 2026 | Full Azeem Mart demonstration | See `FINAL_REVIEW.md` |

Implemented in this repo (master):
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/validate`, `GET /api/v1/auth/users`
- `GET /api/v1/products`, `POST /api/v1/products`, `GET /api/v1/products/{id}`, `PUT /api/v1/products/{id}`, `DELETE /api/v1/products/{id}`
- `GET /api/v1/health`, `GET /api/v1/hello`, `GET /` login page
- PostgreSQL persistence for products, in-memory auth (see README Notes)
