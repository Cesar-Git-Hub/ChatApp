require('dotenv').config();

['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'].forEach((name) => {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
});

const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');                      // <-- new
const rateLimit = require('express-rate-limit');       // <-- new
const { allowedOrigins } = require('./config');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/messages');
const initSocket = require('./socket');

const app = express();
app.set('trust proxy', 1);                             // <-- new
app.use(helmet());                                     // <-- new
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const authLimiter = rateLimit({                        // <-- new
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimiter, authRoutes);         // <-- changed
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);

// Unknown API paths -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });