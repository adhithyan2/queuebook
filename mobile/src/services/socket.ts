import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

type SocketEvent = 'new-notification' | 'position-update';
type Handler = (payload: any) => void;

let socket: Socket | null = null;
const listeners = new Map<SocketEvent, Set<Handler>>();

function getSocketUrl(): string {
  return API_URL.replace(/\/api\/?$/, '');
}

function emit(event: SocketEvent, payload: any) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.warn(`Socket handler error (${event}):`, err);
    }
  });
}

export async function connectSocket() {
  if (socket) return socket;
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  socket = io(getSocketUrl(), { auth: { token } });

  socket.on('new-notification', (payload) => emit('new-notification', payload));
  socket.on('position-update', (payload) => emit('position-update', payload));
  socket.on('connect_error', (err) => {
    console.warn('Socket connect error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribe(event: SocketEvent, handler: Handler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function joinQueueRoom(queueId: string) {
  socket?.emit('join-queue-room', queueId);
}
