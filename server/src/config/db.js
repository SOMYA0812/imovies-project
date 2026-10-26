import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Copy server/.env.example to server/.env');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');

  try {
    const info = await mongoose.connection.db.admin().command({ hello: 1 });
    if (info.setName) {
      console.log(`MongoDB replica set: ${info.setName}`);
    } else {
      console.warn('MongoDB is a standalone server (no replica set). Seat bookings will use the safe non-transactional fallback.');
    }
  } catch {
    // Topology detection is informative only; never block startup on it.
  }
}
