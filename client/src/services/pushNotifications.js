import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey() {
  const res = await API.get('/notifications/vapid-public-key');
  return res.data.publicKey;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  return reg;
}

export async function getPermission() {
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await getPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied');
  }

  const [reg, vapidPublicKey] = await Promise.all([
    navigator.serviceWorker.ready,
    getVapidPublicKey(),
  ]);

  const existing = await reg.pushManager.getSubscription();
  const subscription =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const token = JSON.stringify(subscription);
  await API.post('/notifications/push-token', {
    token,
    platform: 'web',
    deviceName: navigator.userAgent?.slice(0, 120) || 'Web browser',
  });

  return subscription;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    await API.delete('/notifications/push-token', {
      data: { token: JSON.stringify(subscription) },
    });
  }
}
