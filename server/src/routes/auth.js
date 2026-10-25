import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
const router = Router();
const makeToken = (user) => jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and password (at least 8 characters) are required.' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+password');
    if (!user || !await bcrypt.compare(req.body.password || '', user.password)) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
router.get('/me', auth, async (req, res, next) => {
  try { const user = await User.findById(req.user.id); if (!user) return res.status(404).json({ message: 'User not found.' }); res.json({ id: user._id, name: user.name, email: user.email }); }
  catch (e) { next(e); }
});
export default router;
