import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
});
