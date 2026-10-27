const { markDbDisconnected } = require('../config/db');

function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.stack || err.message);

  // PostgreSQL 28P01 means the configured password was rejected. Mark the
  // pool offline so /api/health cannot keep reporting a stale successful
  // connection and subsequent requests can retry after credentials are fixed.
  if (err.code === '28P01') {
    markDbDisconnected(err);
    return res.status(503).json({
      success: false,
      message: 'Database authentication failed. Update DATABASE_URL or the PG* database settings, then restart the backend.',
      databaseStatus: 'DISCONNECTED',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === '23505' || err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique identifier or email address already exists.',
      timestamp: new Date().toISOString()
    });
  }

  const statusCode = err.status || 500;
  const message = statusCode >= 500
    ? 'Internal server error.'
    : (err.message || 'Request could not be completed.');

  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
