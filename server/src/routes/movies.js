import { Router } from 'express';
import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import Booking from '../models/Booking.js';
import SeatLock from '../models/SeatLock.js';
import { isValidDateString, validShowtime } from '../utils/validation.js';

const router = Router();

const starterMovies = [
  { title: 'Interstellar', description: 'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.', genre: 'Sci-Fi', duration: 169, rating: 8.7, language: 'English', releaseYear: 2014, poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { title: 'Inception', description: 'A skilled thief enters dreams to steal secrets and is offered a chance at redemption.', genre: 'Sci-Fi / Thriller', duration: 148, rating: 8.8, language: 'English', releaseYear: 2010, poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
  { title: '3 Idiots', description: 'Three engineering students navigate friendship, pressure, and the meaning of success.', genre: 'Comedy / Drama', duration: 170, rating: 8.4, language: 'Hindi', releaseYear: 2009, poster: 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg' },
  { title: 'Dune: Part Two', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.', genre: 'Adventure / Sci-Fi', duration: 166, rating: 8.5, language: 'English', releaseYear: 2024, poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
  { title: 'La La Land', description: 'A jazz musician and an aspiring actor fall in love while pursuing their dreams in Los Angeles.', genre: 'Romance / Musical', duration: 128, rating: 8.0, language: 'English', releaseYear: 2016, poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg' },
  { title: 'The Dark Knight', description: 'Batman faces a criminal mastermind who wants to plunge Gotham into chaos.', genre: 'Action / Crime', duration: 152, rating: 9.0, language: 'English', releaseYear: 2008, poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Seed demo data once, even if two requests arrive at the same time. */
async function ensureStarterMovies() {
  if (await Movie.estimatedDocumentCount() > 0) return;
  try {
    await Movie.init();
    await Movie.bulkWrite(starterMovies.map((movie) => ({
      updateOne: { filter: { title: movie.title }, update: { $setOnInsert: movie }, upsert: true },
    })), { ordered: false });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
}

router.get('/', async (req, res, next) => {
  try {
    await ensureStarterMovies();
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const filter = search ? { title: { $regex: escapeRegex(search), $options: 'i' } } : {};
    res.json(await Movie.find(filter).sort({ rating: -1 }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid movie id.' });
    }
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    res.json(movie);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid movie id.' });
    }
    const { date, showtime } = req.query;
    if (!isValidDateString(date) || !validShowtime(showtime)) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) and showtime are required.' });
    }
    if (!await Movie.exists({ _id: req.params.id })) {
      return res.status(404).json({ message: 'Movie not found.' });
    }
    const filter = { movie: req.params.id, showDate: date, showtime };
    const [bookings, locks] = await Promise.all([
      Booking.find({ ...filter, status: 'confirmed' }).select('seats').lean(),
      SeatLock.find(filter).select('seat booking').lean(),
    ]);

    // The lock collection is authoritative, but ignore orphaned locks whose
    // booking was never written (possible only after a crash in the fallback path).
    let lockSeats = [];
    if (locks.length) {
      const bookingIds = [...new Set(locks.map((lock) => String(lock.booking)))];
      const confirmed = await Booking.find({ _id: { $in: bookingIds }, status: 'confirmed' }).select('_id').lean();
      const confirmedIds = new Set(confirmed.map((booking) => String(booking._id)));
      lockSeats = locks.filter((lock) => confirmedIds.has(String(lock.booking))).map((lock) => lock.seat);
    }

    res.json({ bookedSeats: [...new Set([...bookings.flatMap((booking) => booking.seats), ...lockSeats])] });
  } catch (error) {
    next(error);
  }
});

export default router;
