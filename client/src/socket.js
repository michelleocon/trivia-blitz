/**
 * Socket.io client singleton.
 * In development: connects to localhost:3001
 * In production:  connects to the same server serving the page
 */
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10_000,
});

if (import.meta.env.DEV) {
  socket.onAny((event, ...args) => console.log(`[socket ←] ${event}`, args));
  socket.onAnyOutgoing((event, ...args) => console.log(`[socket →] ${event}`, args));
}

export default socket;
