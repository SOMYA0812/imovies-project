import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import bookingRoutes from './routes/bookings.js';

for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret' || process.env.JWT_SECRET.startsWith('replace_this_with_a_long_random_secret')) {
  console.warn('Warning: JWT_SECRET is still the example value. Set a long random secret before deploying.');
}

const app = express();

const parseOrigins = (value) => String(value || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...parseOrigins(process.env.CLIENT_URL), 'http://localhost:5173', 'http://127.0.0.1:5173']);

// The Vite dev script binds to 0.0.0.0, so allow private-network origins in development.
const isDevOrigin = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
      || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
      || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
      || hostname.endsWith('.local');
  } catch {
    return false;
  }
};

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && isDevOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'IMovies API' }));

app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));

app.use((err, _req, res, _next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id.' });
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ message: first?.message || 'Invalid input.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That record already exists.' });
  }
  console.error(err);
  if (err.status) return res.status(err.status).json({ message: err.message });
  return res.status(500).json({ message: 'Something went wrong on the server.' });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(port, () => console.log(`IMovies API running at http://localhost:${port}`)))
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
