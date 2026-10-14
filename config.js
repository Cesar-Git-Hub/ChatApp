const allowedOrigins = process.env.CLIENT_URL.split(',').map((s) => s.trim());

module.exports = { allowedOrigins };