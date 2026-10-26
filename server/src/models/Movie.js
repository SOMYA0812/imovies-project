import mongoose from 'mongoose';
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  genre: { type: String, default: 'Drama' },
  duration: { type: Number, default: 120 },
  rating: { type: Number, min: 0, max: 10, default: 8 },
  language: { type: String, default: 'Hindi' },
  poster: { type: String, default: '' },
  releaseYear: { type: Number, default: new Date().getFullYear() },
  showtimes: { type: [String], default: ['10:30 AM', '1:45 PM', '6:30 PM', '9:15 PM'] }
}, { timestamps: true });
export default mongoose.model('Movie', movieSchema);
