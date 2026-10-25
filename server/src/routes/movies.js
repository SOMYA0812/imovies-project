import { Router } from 'express';
import Movie from '../models/Movie.js';
import Booking from '../models/Booking.js';
const router = Router();
const starterMovies = [
 { title:'Interstellar', description:'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.', genre:'Sci-Fi', duration:169, rating:8.7, language:'English', releaseYear:2014, poster:'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
 { title:'Inception', description:'A skilled thief enters dreams to steal secrets and is offered a chance at redemption.', genre:'Sci-Fi / Thriller', duration:148, rating:8.8, language:'English', releaseYear:2010, poster:'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
 { title:'3 Idiots', description:'Three engineering students navigate friendship, pressure, and the meaning of success.', genre:'Comedy / Drama', duration:170, rating:8.4, language:'Hindi', releaseYear:2009, poster:'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg' },
 { title:'Dune: Part Two', description:'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.', genre:'Adventure / Sci-Fi', duration:166, rating:8.5, language:'English', releaseYear:2024, poster:'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
 { title:'La La Land', description:'A jazz musician and an aspiring actor fall in love while pursuing their dreams in Los Angeles.', genre:'Romance / Musical', duration:128, rating:8.0, language:'English', releaseYear:2016, poster:'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg' },
 { title:'The Dark Knight', description:'Batman faces a criminal mastermind who wants to plunge Gotham into chaos.', genre:'Action / Crime', duration:152, rating:9.0, language:'English', releaseYear:2008, poster:'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' }
];
router.get('/', async (req, res, next) => {
  try {
    if (await Movie.countDocuments() === 0) await Movie.insertMany(starterMovies);
    const filter = req.query.search ? { title: { $regex: req.query.search, $options: 'i' } } : {};
    res.json(await Movie.find(filter).sort({ rating: -1 }));
  } catch (e) { next(e); }
});
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { date, showtime } = req.query;
    if (!date || !showtime) return res.status(400).json({ message: 'date and showtime are required.' });
    const bookings = await Booking.find({ movie: req.params.id, showDate: date, showtime, status: 'confirmed' }).select('seats');
    res.json({ bookedSeats: bookings.flatMap(b => b.seats) });
  } catch (e) { next(e); }
});
export default router;
