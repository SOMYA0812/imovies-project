import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import SeatLock from '../models/SeatLock.js';
import { auth } from '../middleware/auth.js';
import { SEAT_PRICE, validSeats, isValidDateString, isPastDate, validShowtime } from '../utils/validation.js';

const router = Router();

let transactionsSupported = true;

const conflictError = (seat) => Object.assign(
  new Error(`Seat ${seat} has just been booked. Please choose another seat.`),
  { status: 409 }
);

const isDuplicateKey = (error) => error?.code === 11000
  || Boolean(error?.writeErrors?.some((writeError) => (writeError.err?.code ?? writeError.code) === 11000))
  || error?.cause?.code === 11000;

const isTransactionUnsupported = (error) => error?.code === 20
  || error?.codeName === 'IllegalOperation'
  || /Transaction numbers are only allowed on a replica set member or mongos/i.test(error?.message || '')
  || /Transactions are not supported/i.test(error?.message || '');

/**
 * Legacy safety net: bookings created before the lock collection existed (or by
 * another client) still reserve their seats.
 */
async function legacyBookingConflict({ movieId, showDate, showtime, seats, session }) {
  let query = Booking.find({
    movie: movieId,
    showDate,
    showtime,
    status: 'confirmed',
    seats: { $in: seats },
  }).select('seats').limit(1).lean();
  if (session) query = query.session(session);
  const [booking] = await query;
  if (!booking) return null;
  return seats.find((seat) => booking.seats.includes(seat)) || null;
}

async function createBooking({ userId, movieId, showDate, showtime, seats }) {
  const bookingId = new mongoose.Types.ObjectId();
  const booking = {
    _id: bookingId,
    user: userId,
    movie: movieId,
    showDate,
    showtime,
    seats,
    total: seats.length * SEAT_PRICE,
  };
  const locks = seats.map((seat) => ({ movie: movieId, showDate, showtime, seat, booking: bookingId }));

  // Make sure the unique index exists before we rely on it for concurrency.
  await SeatLock.init();

  // Preferred path: one transaction for the seat locks + the booking document.
  if (transactionsSupported) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const legacyConflict = await legacyBookingConflict({ movieId, showDate, showtime, seats, session });
        if (legacyConflict) throw conflictError(legacyConflict);
        await SeatLock.insertMany(locks, { session });
        await Booking.create([booking], { session });
      });
      return bookingId;
    } catch (error) {
      if (isTransactionUnsupported(error)) {
        transactionsSupported = false;
        console.warn('[bookings] MongoDB transactions are unavailable on this deployment; using the standalone booking fallback.');
      } else if (isDuplicateKey(error)) {
        throw conflictError(seats[0]);
      } else {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  // Standalone MongoDB fallback: the unique index still serialises seat locks.
  const legacyConflict = await legacyBookingConflict({ movieId, showDate, showtime, seats });
  if (legacyConflict) throw conflictError(legacyConflict);

  try {
    await SeatLock.insertMany(locks);
  } catch (error) {
    if (isDuplicateKey(error)) throw conflictError(seats[0]);
    throw error;
  }

  try {
    await Booking.create(booking);
  } catch (error) {
    await SeatLock.deleteMany({ booking: bookingId });
    if (isDuplicateKey(error)) throw conflictError(seats[0]);
    throw error;
  }

  return bookingId;
}

router.post('/', auth, async (req, res, next) => {
  try {
    const { movieId, showDate, showtime, seats } = req.body ?? {};

    if (!movieId || !mongoose.isValidObjectId(movieId) || !isValidDateString(showDate) || !validShowtime(showtime) || !validSeats(seats)) {
      return res.status(400).json({ message: 'Choose a movie, date, showtime and 1–10 valid unique seats (A01–F12).' });
    }
    if (isPastDate(showDate)) {
      return res.status(400).json({ message: 'Please choose today or a future date.' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    if (movie.showtimes?.length && !movie.showtimes.includes(showtime)) {
      return res.status(400).json({ message: 'That showtime is not available for this movie.' });
    }

    const bookingId = await createBooking({ userId: req.user.id, movieId, showDate, showtime, seats });
    const result = await Booking.findById(bookingId).populate('movie', 'title poster duration');
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/mine', auth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('movie', 'title poster duration')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking id.' });
    }
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled.' });
    }
    booking.status = 'cancelled';
    await booking.save();
    await SeatLock.deleteMany({ booking: booking._id });
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
