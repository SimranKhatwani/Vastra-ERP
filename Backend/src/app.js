const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const ApiError = require('./helpers/ApiError');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Compression & Body Parsing
app.use(compression());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Logging Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
app.use('/api', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    name: 'Vastra ERP SaaS Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1', routes);
app.use('/api', routes); // Alias for convenience

// 404 Route Handler
app.use('*', (req, res, next) => {
  next(new ApiError(404, `Cannot find endpoint ${req.originalUrl} on this server.`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
