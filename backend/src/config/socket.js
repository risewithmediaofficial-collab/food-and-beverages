import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join:factory', (factoryId) => {
      socket.join(`factory:${factoryId}`);
      console.log(`[Socket.IO] ${socket.id} joined factory:${factoryId}`);
    });

    socket.on('join:department', (departmentId) => {
      socket.join(`department:${departmentId}`);
    });

    socket.on('join:machine', (machineId) => {
      socket.join(`machine:${machineId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    console.warn('[Socket.IO Warning] Socket.IO instance requested before initialization.');
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };
  }
  return ioInstance;
};
