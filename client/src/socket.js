import { io } from 'socket.io-client';
import { API_BASE } from './utils/apiBase';
const URL = API_BASE;
export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
});
