import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  showDate: { type: String, required: true },
  showtime: { type: String, required: true },
  seats: { type: [String], required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
}, { timestamps: true });
bookingSchema.index({ movie: 1, showDate: 1, showtime: 1, status: 1 });
export default mongoose.model('Booking', bookingSchema);
