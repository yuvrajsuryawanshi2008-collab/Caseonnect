const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB, isDbConnected, getDbError, requireDbConnection } = require('./config/db');
const { initializeCoreSystem, loadBenchmarkData } = require('./utils/seedData');
const { scanAndProcessDeadlines } = require('./services/escalationEngine');
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { authorizeRoles } = require('./middleware/rbac');
const { ROLES } = require('./config/constants');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware & CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (always accessible regardless of DB state)
app.get('/api/health', (req, res) => {
  const dbConnected = isDbConnected();
  res.json({
    status: 'ONLINE',
    service: 'CaseConnect Core API',
    version: '2.0.0',
    database: {
      connected: dbConnected,
      status: dbConnected ? 'ONLINE' : 'DISCONNECTED',
      provider: 'MongoDB Database (Campus Cluster)',
      error: getDbError()
    },
    timestamp: new Date().toISOString()
  });
});

// Guard data-dependent API routes against offline database
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  return requireDbConnection(req, res, next);
});

// Benchmark bootstrap endpoint (Authorized for Super Admin to seed realistic benchmark verification records)
app.post('/api/admin/bootstrap-benchmark', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const result = await loadBenchmarkData();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/institutions', require('./routes/institutionRoutes'));
app.use('/api/bureaus', require('./routes/bureauRoutes'));
app.use('/api/overlaps', require('./routes/overlapRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

// 405 Method Not Allowed handler for API routes
app.all('/api/*', (req, res, next) => {
  if (['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(req.method)) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `The requested endpoint ${req.method} ${req.path} was not found.`
    });
  }
  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
    message: `HTTP ${req.method} is not supported for ${req.path}.`
  });
});

// Serve static frontend assets
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Client SPA fallback
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();

  if (isDbConnected()) {
    await initializeCoreSystem();

    // Run initial deadline and escalation check
    try {
      await scanAndProcessDeadlines();
    } catch (e) {
      console.warn('[Escalation Engine]', e.message);
    }
  } else {
    console.warn('[Server Startup Warning] Database service is currently offline. Data endpoints will return HTTP 503.');
  }

  // Periodic scheduled check every 30 minutes
  setInterval(async () => {
    if (isDbConnected()) {
      try {
        await scanAndProcessDeadlines();
      } catch (e) {
        console.warn('[Escalation Engine Interval]', e.message);
      }
    }
  }, 30 * 60 * 1000);

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` CaseConnect Institutional Monitoring Platform Online`);
    console.log(` Database: MongoDB Campus Database`);
    console.log(` Server Port: http://localhost:${PORT}`);
    console.log(` Web Interface: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
