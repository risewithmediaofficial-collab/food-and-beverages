import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('[Socket.IO Client] Connected to server ID:', socket.id);
  socket.emit('join:factory', '65f000000000000000000010');
});

socket.on('disconnect', () => {
  console.log('[Socket.IO Client] Disconnected from server');
});
