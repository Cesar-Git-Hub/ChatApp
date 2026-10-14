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
const { allowedOrigins } = require('./config');   // <-- new

const authRoutes = require('./routes/auth');
// ...

const app = express();
app.use(cors({ origin: allowedOrigins }));         // <-- changed
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);

app.use((err, req, res, next) => {
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
