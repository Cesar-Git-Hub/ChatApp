const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const publicMessage = (m) => ({
  id: m._id,
  from: m.sender,
  to: m.recipient,
  text: m.text,
  createdAt: m.createdAt,
});

// Conversation history with one contact (newest 50 by default, oldest first in the response)
// Optional: ?before=<ISO date> to load older messages, ?limit=<1-100>
router.get('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    if (!mongoose.isValidObjectId(contactId)) {
      return res.status(400).json({ message: 'Invalid contact id' });
    }

    const isContact = await User.exists({ _id: req.userId, contacts: contactId });
    if (!isContact) return res.status(403).json({ message: 'This user is not in your contacts' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = {
      $or: [
        { sender: req.userId, recipient: contactId },
        { sender: contactId, recipient: req.userId },
      ],
    };
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!isNaN(before)) filter.createdAt = { $lt: before };
    }

    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({ messages: messages.reverse().map(publicMessage) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;