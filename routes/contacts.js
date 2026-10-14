const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const publicContact = (u) => ({ id: u._id, username: u.username });

// List my contacts
router.get('/', async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).populate('contacts', 'username');
    res.json({ contacts: me.contacts.map(publicContact) });
  } catch (err) {
    next(err);
  }
});

// Search users by username (excludes me and people already in my contacts)
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });

    const me = await User.findById(req.userId);
    const users = await User.find({
      username: { $regex: escapeRegex(q.toLowerCase()), $options: 'i' },
      _id: { $nin: [me._id, ...me.contacts] },
    })
      .select('username')
      .limit(10);

    res.json({ users: users.map(publicContact) });
  } catch (err) {
    next(err);
  }
});

// Add a contact by username (added on both sides so both can chat)
router.post('/', async (req, res, next) => {
  try {
    const username = (req.body.username || '').toLowerCase().trim();
    if (!username) return res.status(400).json({ message: 'Username is required' });

    const target = await User.findOne({ username });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target._id.equals(req.userId)) {
      return res.status(400).json({ message: "You can't add yourself" });
    }

    await User.updateOne({ _id: req.userId }, { $addToSet: { contacts: target._id } });
    await User.updateOne({ _id: target._id }, { $addToSet: { contacts: req.userId } });

    res.status(201).json({ contact: publicContact(target) });
  } catch (err) {
    next(err);
  }
});

// Remove a contact (removed on both sides)
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact id' });
    }

    await User.updateOne({ _id: req.userId }, { $pull: { contacts: req.params.id } });
    await User.updateOne({ _id: req.params.id }, { $pull: { contacts: req.userId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;