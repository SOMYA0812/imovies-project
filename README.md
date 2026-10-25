# IMovies — MERN Movie Ticket Booking App

A full-stack starter project with a React/Vite frontend, Express API, MongoDB persistence, JWT authentication, movie discovery, showtime/date selection, seat availability, booking history, and cancellation.

## Requirements
- Node.js 18+ (recommended; Node 16 is no longer recommended for current Vite versions)
- npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code and a modern browser

## 1. Configure MongoDB and the server

1. Install and start MongoDB, or create a MongoDB Atlas cluster.
2. Copy `server/.env.example` to `server/.env`.
3. Set `MONGODB_URI` to your local or Atlas connection string.
4. Change `JWT_SECRET` to a long, random secret. Do not commit `.env` to Git.

Example local configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/imovies
JWT_SECRET=use-a-long-random-secret-here
CLIENT_URL=http://localhost:5173
```

## 2. Install dependencies

From the project root:

```bash
npm install
npm run install:all
```

If the root `concurrently` dependency was not installed, run `npm install` again from the root.

## 3. Start the application

Ensure MongoDB is running and `server/.env` exists. From the root folder:

```bash
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000`; health check: `http://localhost:5000/api/health`.

Alternatively, run the processes in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## Features
- Responsive movie catalogue with search and movie detail pages
- Seed catalogue automatically created on the first movie request if the database is empty
- Register/login with bcrypt password hashing and JWT token authentication
- Select a date, showtime, and seats (A01–F12); up to 10 seats per booking
- Check booked seats and prevent conflicts using a MongoDB transaction
- View personal bookings and cancel a booking
- API request rate limiting on authentication routes

## API routes

| Method | Route | Purpose | Auth |
|---|---|---|---|
| GET | `/api/health` | API status | No |
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Current user | Yes |
| GET | `/api/movies` | List/search movies | No |
| GET | `/api/movies/:id/availability?date=YYYY-MM-DD&showtime=6%3A30%20PM` | Booked seats | No |
| POST | `/api/bookings` | Create booking | Yes |
| GET | `/api/bookings/mine` | Current user's bookings | Yes |
| PATCH | `/api/bookings/:id/cancel` | Cancel own booking | Yes |

Booking request body:

```json
{
  "movieId": "MONGODB_MOVIE_ID",
  "showDate": "2026-12-08",
  "showtime": "6:30 PM",
  "seats": ["A01", "A02"]
}
```

Seat price is currently a demo flat rate of ₹180 per seat. No payment gateway is integrated. External poster images require an internet connection.

## Important implementation notes
- MongoDB transactions require a replica set. MongoDB Atlas supports this; a local standalone MongoDB instance may reject transactions. For local transaction testing, configure a single-node replica set or adapt the booking implementation for a development-only environment.
- The seed movies are demo data. The catalogue endpoint seeds them when the movie collection is empty.
- JWT is stored in browser local storage in this educational starter; for production, evaluate secure, HTTP-only cookies, CSRF protection, stricter validation, and a more complete threat model.
- Real-time seat status is fetched when a date/showtime changes. For live push updates, add WebSockets or Server-Sent Events.
- This is a working educational baseline, not a production cinema/payment system. Add tests, deployment configuration, email confirmations, payment processing, and admin tools before production use.
