import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { ensureDefaultUsers } from './modules/auth/auth.routes.js';

const server = http.createServer(app);

initSocket(server);

const listenOnPort = (port) => {
  server.listen(port, () => {
    console.log(`===================================================`);
    console.log(`🚀 Juice ERP Backend Server running on port ${port}`);
    console.log(`📡 REST API endpoint: http://localhost:${port}/api/v1`);
    console.log(`⚡ Socket.IO server active`);
    console.log(`===================================================`);
  });
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(config.port) + 1;
    console.warn(`[Port Warning] Port ${config.port} is already in use. Retrying on port ${fallbackPort}...`);
    listenOnPort(fallbackPort);
  } else {
    console.error('[Server Error]:', err);
  }
});

const startServer = async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    await ensureDefaultUsers();
  } else {
    console.error('[Startup] Database connection failed. Server will still start, but some features may not be available.');
  }

  listenOnPort(config.port);
};

startServer();
