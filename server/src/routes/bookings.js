import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import { auth } from '../middleware/auth.js';
const router = Router();
const validSeats = (seats) => Array.isArray(seats) && seats.length > 0 && seats.length <= 10 && seats.every(s => /^[A-F](0[1-9]|1[0-2])$/.test(s)) && new Set(seats).size === seats.length;
router.post('/', auth, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { movieId, showDate, showtime, seats } = req.body;
    if (!movieId || !mongoose.isValidObjectId(movieId) || !showDate || !showtime || !validSeats(seats)) return res.status(400).json({ message: 'Choose a movie, date, showtime and 1–10 valid unique seats (A01–F12).' });
    if (showDate < new Date().toISOString().slice(0, 10)) return res.status(400).json({ message: 'Please choose today or a future date.' });
    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    let created;
    await session.withTransaction(async () => {
      const bookings = await Booking.find({ movie: movieId, showDate, showtime, status: 'confirmed' }).session(session).select('seats');
      const booked = new Set(bookings.flatMap(b => b.seats));
      const conflict = seats.find(s => booked.has(s));
      if (conflict) { const err = new Error(`Seat ${conflict} has just been booked. Please choose another seat.`); err.status = 409; throw err; }
      [created] = await Booking.create([{ user: req.user.id, movie: movieId, showDate, showtime, seats, total: seats.length * 180 }], { session });
    });
    const result = await Booking.findById(created._id).populate('movie', 'title poster duration');
    res.status(201).json(result);
  } catch (e) { next(e); }
  finally { await session.endSession(); }
});
router.get('/mine', auth, async (req, res, next) => {
  try { res.json(await Booking.find({ user: req.user.id }).populate('movie', 'title poster duration').sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});
router.patch('/:id/cancel', auth, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'This booking is already cancelled.' });
    booking.status = 'cancelled'; await booking.save(); res.json(booking);
  } catch (e) { next(e); }
});
export default router;
