const assert = require('assert');
const express = require('express');
const http = require('http');
const { listenApp } = require('../backend/server');

async function run() {
  const occupiedServer = http.createServer();
  await new Promise((resolve, reject) => {
    occupiedServer.once('error', reject);
    occupiedServer.listen(0, resolve);
  });

  try {
    const port = occupiedServer.address().port;
    await assert.rejects(
      listenApp(express(), port),
      error => error.code === 'EADDRINUSE' && /already in use/i.test(error.message)
    );
    console.log('[PASS] Port conflicts return a clear startup error without stopping the current listener.');
  } finally {
    await new Promise(resolve => occupiedServer.close(resolve));
  }
}

run().catch(error => {
  console.error('[FAIL] Startup safety check:', error.message);
  process.exitCode = 1;
});
