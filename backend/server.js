const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, closeDB, isDbConnected, getDbError, requireDbConnection } = require('./config/db');
const { loadBenchmarkData } = require('./utils/seedData');
const { scanAndProcessDeadlines } = require('./services/escalationEngine');
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { authorizeRoles } = require('./middleware/rbac');
const { ROLES } = require('./config/constants');

const app = express();
const PORT = process.env.PORT || 5000;

function listenApp(application, port) {
  return new Promise((resolve, reject) => {
    const server = application.listen(port);
    const handleError = (err) => {
      if (err.code === 'EADDRINUSE') {
        err.message = `Port ${port} is already in use. Identify the existing process before starting another CaseConnect server.`;
      }
      reject(err);
    };
    server.once('listening', () => {
      server.off('error', handleError);
      resolve(server);
    });
    server.once('error', handleError);
  });
}

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
  credentials: false
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (always accessible regardless of DB state)
app.get('/api/health', async (req, res) => {
  if (!isDbConnected()) {
    try {
      // Serverless cold starts do not run startServer(); make readiness checks
      // initialize the same database connection used by data routes.
      await connectDB();
    } catch {
      // Keep health available while reporting the dependency as degraded.
    }
  }

  const dbConnected = isDbConnected();
  res.json({
    status: dbConnected ? 'ONLINE' : 'DEGRADED',
    service: 'CaseConnect AICTE Monitoring API',
    version: '2.0.0',
    database: {
      connected: dbConnected,
      status: dbConnected ? 'ONLINE' : 'DISCONNECTED',
      provider: 'Supabase PostgreSQL (Transaction Pooler)',
      error: dbConnected ? null : (getDbError() && /password authentication failed/i.test(getDbError())
        ? 'Supabase rejected the configured database password.'
        : 'Database is unavailable. Check the configured Supabase connection settings.')
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

// GET /api/admin/students - Authorized regulatory review of registered students
app.get('/api/admin/students', authenticateToken, authorizeRoles(
  ROLES.SUPER_ADMIN, 
  ROLES.SENIOR_MONITORING_OFFICER, 
  ROLES.BUREAU_OFFICER, 
  ROLES.REGIONAL_REVIEWER
), async (req, res, next) => {
  try {
    const Student = require('./models/Student');
    const { query, college, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { studentIdNumber: { $regex: query, $options: 'i' } }
      ];
    }

    if (college) {
      filter.college = { $regex: college, $options: 'i' };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      students
    });
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
  try {
    await connectDB();
  } catch (e) {
    console.warn('[Server Startup Warning] Database is unavailable; data endpoints will return HTTP 503.');
  }

  if (!isDbConnected()) {
    console.warn('[Server Startup Warning] Database service is currently offline. Data endpoints will return HTTP 503.');
  }

  let server;
  try {
    server = await listenApp(app, PORT);
  } catch (err) {
    if (require.main === module) await closeDB().catch(() => {});
    throw err;
  }

  console.log('=======================================================');
  console.log(' CaseConnect API started.');
  console.log(' Server Port: http://localhost:' + PORT);
  console.log('=======================================================');

  const deadlineInterval = setInterval(async () => {
    if (isDbConnected()) {
      try {
        await scanAndProcessDeadlines();
      } catch (e) {
        console.warn('[Escalation Engine Interval]', e.message);
      }
    }
  }, 30 * 60 * 1000);
  deadlineInterval.unref?.();
  server.once('close', () => clearInterval(deadlineInterval));

  if (isDbConnected()) {
    try {
      await scanAndProcessDeadlines();
    } catch (e) {
      console.warn('[Escalation Engine]', e.message);
    }
  }

  return server;
}

if (require.main === module) {
  startServer().then((server) => {
    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      server.close(() => {
        closeDB().catch(() => {});
      });
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }).catch(async (err) => {
    console.error('[Server Startup Error] ' + err.message);
    await closeDB().catch(() => {});
    process.exitCode = 1;
  });
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.listenApp = listenApp;
