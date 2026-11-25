import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

export function criarConexaoSocket(): Socket {
  return io(API_BASE_URL, { transports: ['websocket'] });
}
