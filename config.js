const allowedOrigins = process.env.CLIENT_URL
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = { allowedOrigins };