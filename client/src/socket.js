/**
 * Socket.io client singleton
 *
 * Import `socket` wherever you need real-time communication.
 * The connection is lazy — it doesn't actually connect until
 * socket.connect() is called or the first event is emitted.
 */
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: false,   // connect explicitly so we control timing
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10_000,
});

// Development logging
if (import.meta.env.DEV) {
  socket.onAny((event, ...args) => {
    console.log(`[socket ←] ${event}`, args);
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`[socket →] ${event}`, args);
  });
}

export default socket;
