import mongoose from 'mongoose';

/**
 * One document per seat/show. The unique compound index is what actually makes
 * seat booking conflict-safe: two concurrent requests cannot insert the same
 * { movie, showDate, showtime, seat } tuple, even on a standalone MongoDB.
 */
const seatLockSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  showDate: { type: String, required: true },
  showtime: { type: String, required: true },
  seat: { type: String, required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
}, { timestamps: true });

seatLockSchema.index({ movie: 1, showDate: 1, showtime: 1, seat: 1 }, { unique: true });
seatLockSchema.index({ booking: 1 });

export default mongoose.model('SeatLock', seatLockSchema);
