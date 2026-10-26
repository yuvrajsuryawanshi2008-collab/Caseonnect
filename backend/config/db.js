const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;
let memoryServerInstance = null;

const connectDB = async () => {
  const customUri = process.env.MONGODB_URI;
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/caseconnect';
  const targetUri = customUri || defaultLocalUri;

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${targetUri}`);
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    connectionError = null;
    console.log('[Database] MongoDB connection established successfully via configured URI.');
    return;
  } catch (err) {
    console.warn(`[Database Notice] Could not connect to primary URI (${targetUri}): ${err.message}`);

    // In development or local testing, provide self-healing local daemon fallback
    try {
      console.log('[Database] Initializing embedded MongoDB daemon via mongodb-memory-server for local development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const embeddedUri = memoryServerInstance.getUri();

      await mongoose.connect(embeddedUri, {
        serverSelectionTimeoutMS: 5000
      });

      isConnected = true;
      connectionError = null;
      console.log(`[Database] Embedded MongoDB daemon online at: ${embeddedUri}`);
      console.log('[Database] Full MongoDB/Mongoose models, collections, indexes, and wire protocol are active.');
      return;
    } catch (fallbackErr) {
      isConnected = false;
      connectionError = `Primary connection failed: ${err.message}. Embedded fallback failed: ${fallbackErr.message}`;
      console.error(`[Database Critical Error] ${connectionError}`);
      console.error('[Database Resolution] Please verify MONGODB_URI in backend/.env or start local mongod daemon.');
    }
  }
};

const isDbConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

const getDbError = () => connectionError;

const requireDbConnection = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB database service is currently unavailable. Please verify MONGODB_URI in backend/.env.',
      databaseStatus: 'DISCONNECTED',
      error: connectionError
    });
  }
  next();
};

module.exports = {
  connectDB,
  isDbConnected,
  getDbError,
  requireDbConnection
};
