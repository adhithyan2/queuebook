const fs = require('fs');
const path = require('path');
const webPush = require('web-push');

const VAPID_KEYS_FILE = path.join(__dirname, '..', '.vapid-keys.json');

function loadVapidKeys() {
  const fromEnvPublic = process.env.VAPID_PUBLIC_KEY;
  const fromEnvPrivate = process.env.VAPID_PRIVATE_KEY;
  if (fromEnvPublic && fromEnvPrivate) {
    return { publicKey: fromEnvPublic, privateKey: fromEnvPrivate };
  }

  if (fs.existsSync(VAPID_KEYS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, 'utf8'));
    } catch (err) {
      console.warn('Failed to read VAPID keys file:', err.message);
    }
  }

  const keys = webPush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(keys, null, 2));
  console.log('Generated new VAPID keys and saved to', VAPID_KEYS_FILE);
  console.log('Add VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY to your .env to persist them.');
  return keys;
}

const vapid = loadVapidKeys();
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@queuebook.app';

webPush.setVapidDetails(vapidSubject, vapid.publicKey, vapid.privateKey);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoToken(token) {
  return /^(ExponentPushToken|ExpoPushToken)\[/.test(String(token).trim());
}

function isWebSubscription(token) {
  const value = String(token).trim();
  return value.startsWith('{') && value.includes('endpoint');
}

async function sendExpoPush(tokens, { title, body, data }) {
  const messages = tokens
    .filter(isExpoToken)
    .map((token) => ({
      to: token.trim(),
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

  if (messages.length === 0) return [];

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Expo push request failed');
  }
  return result.data || [];
}

async function sendWebPush(subscriptions, { title, body, data }) {
  const results = [];
  for (const raw of subscriptions) {
    if (!isWebSubscription(raw)) continue;

    let subscription;
    try {
      subscription = JSON.parse(raw);
    } catch (err) {
      results.push({ ok: false, error: 'Invalid web subscription', token: raw });
      continue;
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
    });

    try {
      await webPush.sendNotification(subscription, payload);
      results.push({ ok: true, token: raw });
    } catch (err) {
      results.push({ ok: false, error: err.message, token: raw });
      if (err.statusCode === 404 || err.statusCode === 410) {
        results[results.length - 1].gone = true;
      }
    }
  }
  return results;
}

/**
 * Send a push notification to every device registered for a user.
 * Returns { expo, web } result summaries.
 */
async function sendUserPush(user, { title, body, data }) {
  const tokens = user?.pushTokens || [];
  if (tokens.length === 0) return { expo: [], web: [], count: 0 };

  const expoTokens = tokens.filter((t) => t.platform === 'expo' || isExpoToken(t.token)).map((t) => t.token);
  const webTokens = tokens.filter((t) => t.platform === 'web').map((t) => t.token);

  let expo = [];
  let web = [];

  if (expoTokens.length > 0) {
    try {
      expo = await sendExpoPush(expoTokens, { title, body, data });
    } catch (err) {
      console.error('Expo push error:', err.message);
    }
  }

  if (webTokens.length > 0) {
    web = await sendWebPush(webTokens, { title, body, data });
    const gone = web.filter((r) => r.gone).map((r) => r.token);
    if (gone.length > 0) {
      const remaining = tokens.filter((t) => !(t.platform === 'web' && gone.includes(t.token)));
      try {
        user.pushTokens = remaining;
        await user.save();
      } catch (err) {
        console.error('Failed to prune stale web push tokens:', err.message);
      }
    }
  }

  return { expo, web, count: expo.length + web.filter((r) => r.ok).length };
}

module.exports = {
  sendUserPush,
  sendExpoPush,
  sendWebPush,
  isExpoToken,
  isWebSubscription,
  getVapidPublicKey: () => vapid.publicKey,
};
