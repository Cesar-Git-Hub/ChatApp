const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, username: u.username, email: u.email });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const cleanUsername = String(username).toLowerCase().trim();
    const cleanEmail = String(email).toLowerCase().trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ message: 'Username must be between 3 and 20 characters' });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ message: 'Password must be between 6 and 72 characters' });
    }

    const exists = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });
    if (exists) return res.status(409).json({ message: 'Username or email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: cleanUsername, email: cleanEmail, password: hash });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    // Two simultaneous requests can pass the check above; the unique index catches the second one
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username or email already in use' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid user data' });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // username or email
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    const id = String(identifier).toLowerCase().trim();
    const user = await User.findOne({ $or: [{ username: id }, { email: id }] });
    const valid = user && (await bcrypt.compare(password, user.password));
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;