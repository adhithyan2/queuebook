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

const ANDROID_CHANNEL_DEFAULT = 'queuebook-default';
const ANDROID_CHANNEL_QUIET = 'queuebook-quiet';

function isExpoToken(token) {
  return /^(ExponentPushToken|ExpoPushToken)\[/.test(String(token).trim());
}

function isWebSubscription(token) {
  const value = String(token).trim();
  return value.startsWith('{') && value.includes('endpoint');
}

/**
 * Send an Expo push to one or more devices. The message always carries the
 * fields required for Android to render the tray notification natively while
 * the app is backgrounded/locked:
 *   to, title, body, sound: 'default', priority: 'high', data (+ channelId)
 *
 * Returns the per-ticket Expo response array (same order as `tokens`).
 */
async function sendExpoPush(tokens, { title, body, data, channelId, priority = 'high' }) {
  const now = Date.now();
  const messages = tokens
    .filter(isExpoToken)
    .map((token, index) => {
      const uid = `qb-${now}-${index}`;
      const message = {
        to: token.trim(),
        title,
        body,
        sound: 'default',
        priority,
        data: { ...(data || {}), id: uid, tag: uid },
      };
      if (channelId) message.channelId = channelId;
      return message;
    });

  if (messages.length === 0) return [];

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const raw = await res.text();
  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Expo push request failed (${res.status}): non-JSON response`);
  }

  if (!res.ok) {
    throw new Error(result.message || `Expo push request failed (${res.status})`);
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
 *
 * The Android channel is chosen from the user's vibration preference so the
 * native tray notification honors it even when the app is not running:
 *   - ON  -> queuebook-default (vibrates)
 *   - OFF -> queuebook-quiet   (sound only, no vibration)
 */
async function sendUserPush(user, { title, body, data }) {
  const tokens = user?.pushTokens || [];
  if (tokens.length === 0) return { expo: [], web: [], count: 0 };

  const channelId = user.vibrationPreference === false ? ANDROID_CHANNEL_QUIET : ANDROID_CHANNEL_DEFAULT;
  const expoEntries = tokens
    .map((t, index) => ({ index, token: String(t.token), platform: t.platform }))
    .filter((entry) => entry.platform === 'expo' || isExpoToken(entry.token));
  const webTokens = tokens.filter((t) => t.platform === 'web').map((t) => t.token);

  let expo = [];
  let web = [];

  if (expoEntries.length > 0) {
    const expoTokens = expoEntries.map((e) => e.token);
    try {
      expo = await sendExpoPush(expoTokens, { title, body, data, channelId });

      // Expo returns one ticket per message, in the same order we sent them.
      const invalidTokens = [];
      expo.forEach((ticket, i) => {
        if (ticket?.status !== 'ok') {
          const detail = ticket?.details?.error || ticket?.message || 'unknown';
          console.warn(`Expo push ticket error [${detail}]:`, ticket?.message || JSON.stringify(ticket));
          if (ticket?.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(expoTokens[i]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        const invalidSet = new Set(invalidTokens);
        const remaining = tokens.filter((t) => !invalidSet.has(String(t.token)));
        try {
          user.pushTokens = remaining;
          await user.save();
          console.warn(`Pruned ${invalidTokens.length} invalid Expo device token(s) for user ${user._id}`);
        } catch (err) {
          console.error('Failed to prune invalid Expo tokens:', err.message);
        }
      }
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
