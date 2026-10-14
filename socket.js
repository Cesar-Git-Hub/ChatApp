const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');
const { allowedOrigins } = require('./config');

const publicMessage = (m) => ({
  id: m._id,
  from: m.sender,
  to: m.recipient,
  text: m.text,
  createdAt: m.createdAt,
});

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins },               // <-- changed
  });
  // Authenticate every connection with the same JWT used by the REST API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Not authenticated'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // One room per user, so every open tab/device of that user receives messages
    socket.join(`user:${socket.userId}`);

    socket.on('message:send', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const to = payload && payload.to;
        const text = payload && typeof payload.text === 'string' ? payload.text.trim() : '';

        if (!mongoose.isValidObjectId(to)) return reply({ ok: false, message: 'Invalid recipient' });
        if (!text) return reply({ ok: false, message: 'Message is empty' });
        if (text.length > 2000) return reply({ ok: false, message: 'Message is too long' });

        // Only people who are in your contacts can be messaged
        const isContact = await User.exists({ _id: socket.userId, contacts: to });
        if (!isContact) return reply({ ok: false, message: 'This user is not in your contacts' });

        const saved = await Message.create({ sender: socket.userId, recipient: to, text });
        const message = publicMessage(saved);

        io.to(`user:${to}`).to(`user:${socket.userId}`).emit('message:new', message);
        reply({ ok: true, message });
      } catch (err) {
        console.error('message:send failed:', err);
        reply({ ok: false, message: 'Server error' });
      }
    });
  });

  return io;
}

module.exports = initSocket;
