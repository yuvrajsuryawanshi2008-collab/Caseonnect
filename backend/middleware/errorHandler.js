function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.stack || err.message);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Council System Error';

  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
