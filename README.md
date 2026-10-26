# 🎬 IMovies — MERN Movie Ticket Booking App

A full-stack movie ticket booking application built with **MongoDB**, **Express**, **React**, and **Node.js**. Features include JWT authentication, movie catalogue with auto-seed, seat selection, booking history, and cancellation.

![Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?logo=react) ![License](https://img.shields.io/badge/License-MIT-green)

> 🖥️ **Prefer running without Docker?** A native MongoDB installation works too
> (standalone or single-node replica set) — see
> [Windows Quick Start](#-windows-quick-start--native-mongodb-no-docker).

---

## ✨ Features

- 🎥 Responsive movie catalogue with search
- 🪑 Select a date, showtime, and up to 10 seats (A01–F12)
- 🔐 Register / Login with bcrypt + JWT
- 📋 View personal bookings and cancel them
- 🔒 Conflict-safe seat booking enforced by a unique MongoDB seat-lock index
- 🌱 Auto-seeds sample movies on first request
- 🚦 Rate limiting on auth routes

---

## 🏗 Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend  | Node.js 20, Express 4, Mongoose 8  |
| Database | MongoDB 7+ (replica set recommended; standalone supported) |
| Auth     | JWT, bcryptjs                      |
| DevOps   | Docker, Docker Compose, nginx      |

---

## 🚀 Quick Start — Docker (Recommended)

> **Prerequisites**: [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/imovies-project.git
cd imovies-project

# 2. Copy environment file
copy server\.env.example server\.env   # Windows
# cp server/.env.example server/.env   # Mac / Linux

# 3. (Optional) Edit server/.env and set a strong JWT_SECRET

# 4. Start everything
docker compose up --build
```

- **Client**: http://localhost:5173
- **API**: http://localhost:5000
- **Health check**: http://localhost:5000/api/health

To stop: `docker compose down`  
To wipe the database too: `docker compose down -v`

---

## 🪟 Windows Quick Start — Native MongoDB (no Docker)

Docker is optional; the whole stack runs natively. A user-space MongoDB install
(no admin rights needed) can be laid out like this:

| Item | Example location |
|------|------------------|
| MongoDB binary | `%USERPROFILE%\mongodb\bin\mongod.exe` (also add it to your user `PATH`) |
| Data directory | `%USERPROFILE%\mongodb\data` |
| Log file | `%USERPROFILE%\mongodb\log\mongod.log` |
| Connection string | `mongodb://127.0.0.1:27017/imovies?replicaSet=rs0` |
| Auto-start at logon | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\start-imovies-mongodb.vbs` |

Start MongoDB manually if it is not already running:

```powershell
& "$env:USERPROFILE\mongodb\start-mongodb.ps1"
```

Then start the app:

```powershell
npm install
npm run install:all
npm run dev
```

Open **http://localhost:5173**.

> A standalone MongoDB (without a replica set) also works: the API detects it
> and automatically uses the non-transactional seat-lock fallback.

---


## 🛠 Local Development (Hot-Reload)

This mode runs MongoDB in Docker but the server and client natively — giving you fast hot-reload.

### Prerequisites

- Node.js 20+
- Docker Desktop

```bash
# 1. Start MongoDB via Docker
docker compose -f docker-compose.dev.yml up -d

# 2. Configure environment
copy server\.env.example server\.env   # Windows
# cp server/.env.example server/.env   # Mac / Linux

# 3. Install dependencies
npm install
npm run install:all

# 4. Run server + client concurrently
npm run dev
```

- **Client**: http://localhost:5173
- **API**: http://localhost:5000/api/health

---

## ⚙️ Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values:

| Variable       | Description                                      | Default                                              |
|----------------|--------------------------------------------------|------------------------------------------------------|
| `PORT`         | Express server port                              | `5000`                                               |
| `MONGODB_URI`  | MongoDB connection string (replica set optional)  | `mongodb://127.0.0.1:27017/imovies?replicaSet=rs0` |
| `JWT_SECRET`   | Long random secret for JWT signing               | *(must be changed)*                                  |
| `CLIENT_URL`   | Allowed CORS origin                              | `http://localhost:5173`                              |

> ⚠️ **Never commit `.env` to Git.** It is listed in `.gitignore`.

> The client reads `VITE_API_URL` when provided; otherwise it calls
> `http://<page-host>:5000/api`, which keeps LAN/phone testing working with the
> Vite dev server.

---

## 📡 API Reference

| Method  | Route                                        | Purpose              | Auth |
|---------|----------------------------------------------|----------------------|------|
| `GET`   | `/api/health`                                | API status           | No   |
| `POST`  | `/api/auth/register`                         | Create account       | No   |
| `POST`  | `/api/auth/login`                            | Sign in              | No   |
| `GET`   | `/api/auth/me`                               | Current user         | Yes  |
| `GET`   | `/api/movies`                                | List / search movies | No   |
| `GET`   | `/api/movies/:id`                            | Movie details        | No   |
| `GET`   | `/api/movies/:id/availability?date=&showtime=` | Booked seats       | No   |
| `POST`  | `/api/bookings`                              | Create booking       | Yes  |
| `GET`   | `/api/bookings/mine`                         | My bookings          | Yes  |
| `PATCH` | `/api/bookings/:id/cancel`                   | Cancel booking       | Yes  |

**Booking request body:**

```json
{
  "movieId": "MONGODB_MOVIE_ID",
  "showDate": "2026-12-08",
  "showtime": "6:30 PM",
  "seats": ["A01", "A02"]
}
```

Seat price: **₹180 per seat** (demo flat rate).

---

## 📁 Project Structure

```
imovies-project/
├── client/                  # React + Vite frontend
│   ├── src/
│   ├── Dockerfile           # Production: nginx serves Vite build
│   ├── nginx.conf           # SPA routing + API proxy
│   └── package.json
├── server/                  # Express API
│   ├── src/
│   │   ├── config/db.js     # Mongoose connection
│   │   ├── middleware/auth.js
│   │   ├── models/          # User, Movie, Booking, SeatLock
│   │   ├── routes/          # auth, movies, bookings
│   │   ├── utils/           # shared validation helpers
│   │   └── server.js
│   ├── Dockerfile           # Production server image
│   ├── .env.example         # Environment template
│   └── package.json
├── docker-compose.yml       # Full stack (prod-like)
├── docker-compose.dev.yml   # MongoDB only (local dev)
└── package.json             # Root scripts (concurrently)
```

---

## 🐳 Docker Architecture

```
┌──────────────────────────────────────────┐
│  docker compose up                        │
│                                           │
│  ┌─────────────┐   ┌──────────────────┐  │
│  │  imovies_   │   │  imovies_server  │  │
│  │  client     │──▶│  (Express :5000) │  │
│  │  (nginx:80) │   └────────┬─────────┘  │
│  │  :5173      │            │             │
│  └─────────────┘   ┌────────▼─────────┐  │
│                     │  imovies_mongo   │  │
│                     │  (MongoDB :27017)|  │
│                     │  replica set rs0 │  │
│                     └──────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 📝 Notes

- Seat conflicts are prevented by the `seatlocks` collection. It has a unique
  index on `{ movie, showDate, showtime, seat }`, so two concurrent requests can
  never lock the same seat — even on a standalone MongoDB. When a replica set is
  available, locks and the booking are written in one transaction; otherwise a
  cleanup fallback is used. (Transactions alone do **not** prevent double
  booking, because they write different documents and hit write skew.)
- JWT is stored in `localStorage` — fine for learning; for production use HTTP-only cookies.
- External movie posters are fetched from TMDB CDN and require internet access.
- This is an **educational baseline** — add tests, payment processing, and proper security before production.

---

## 📄 License

MIT
