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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in local/LAN network or when scanned via phone
    callback(null, true);
  },
  credentials: true
}));

// Compression & Body Parsing
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Logging Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
app.use('/api', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Health & Status
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'UP',
    name: 'Vastra ERP SaaS Backend',
    message: 'API is operational',
    timestamp: new Date().toISOString()
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

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

// Direct Public PDF Document Routes (Root domain QR scans directly stream Single-Page PDF)
const BillingController = require('./controllers/billing.controller');
const PSSMController = require('./controllers/pssm.controller');

app.get('/invoice/track/:invoiceNo', BillingController.streamInvoicePDFPublic);
app.get('/bill/track/:invoiceNo', BillingController.streamInvoicePDFPublic);
app.get('/track/:billNo', BillingController.streamInvoicePDFPublic);
app.get('/pssm/track/:pssmNo', PSSMController.streamPSSMPDFPublic);
app.get('/track-pssm/:pssmNo', PSSMController.streamPSSMPDFPublic);

// 404 Route Handler
app.use('*', (req, res, next) => {
  next(new ApiError(404, `Cannot find endpoint ${req.originalUrl} on this server.`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
