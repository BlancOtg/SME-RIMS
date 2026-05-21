require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)\x1b[0m`);
    if (req.body && Object.keys(req.body).length) console.log('  body:', JSON.stringify(req.body));
    if (req.query && Object.keys(req.query).length) console.log(' query:', JSON.stringify(req.query));
  });
  next();
});

// --- Routes (to be built out) ---
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/invoices',  require('./routes/invoices'));
app.use('/api/receipts',  require('./routes/receipts'));
app.use('/api/vendors',   require('./routes/vendors'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/dashboard', require('./routes/dashboard'));

// --- Health check ---
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// --- Central error handler ---
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// --- DB + Server startup ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rims';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
