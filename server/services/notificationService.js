const Notification = require('../models/Notification');
const MessageLog = require('../models/MessageLog');
const { sendUserPush } = require('./pushService');
const { emitToUser } = require('../socket/queueHandler');

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const SMS_CHANNEL = process.env.SMS_CHANNEL === 'whatsapp' ? 'whatsapp' : 'sms';

const TITLES = {
  otp: 'Phone verification',
  booking_confirmed: 'Booking confirmed',
  position_update: 'Queue position updated',
  turn_coming: 'Your turn is coming',
  turn_now: 'Your turn is now',
  completed: 'Visit completed',
  cancelled: 'Booking cancelled',
  rescheduled: 'Booking rescheduled',
  welcome: 'Welcome to QueueBook',
};

const TEMPLATES = {
  otp: ({ otp }) =>
    `QueueBook: Your verification code is ${otp}. It expires in 10 minutes.`,
  booking_confirmed: ({ businessName, tokenNumber, peopleAhead, waitTime }) =>
    `QueueBook: Your booking at ${businessName} is confirmed.\n` +
    `Token: ${tokenNumber}\n` +
    `${peopleAhead} people ahead of you.\n` +
    `Estimated waiting time: ${waitTime} minutes.\n` +
    `We'll notify you when your turn is near.`,
  position_update: ({ businessName, peopleAhead, waitTime }) =>
    `QueueBook: Queue position update at ${businessName}.\n` +
    `${peopleAhead} people ahead of you.\n` +
    `Estimated waiting time: ${waitTime} minutes.`,
  turn_coming: ({ businessName, minutes }) =>
    `QueueBook Alert: Your turn is approaching.\n` +
    `Please reach ${businessName} within approximately ${minutes} minutes.`,
  turn_now: ({ businessName, tokenNumber }) =>
    `QueueBook Alert: Your turn is now.\n` +
    `Please reach ${businessName} immediately. Token ${tokenNumber} is being served.`,
  completed: ({ businessName }) =>
    `QueueBook: Your visit to ${businessName} has been completed.\n` +
    `Thank you for using QueueBook!`,
  cancelled: ({ businessName, tokenNumber }) =>
    `QueueBook: Your token ${tokenNumber} at ${businessName} has been cancelled.`,
  rescheduled: ({ businessName, date, timeSlot }) =>
    `QueueBook: Your appointment at ${businessName} has been rescheduled to ${date} at ${timeSlot}.`,
  welcome: ({ businessName }) =>
    `QueueBook: Welcome! Your verified number is set up for queue notifications.`,
};

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

async function sendViaProvider({ to, body, channel }) {
  const useWhatsApp = channel === 'whatsapp';
  const from = useWhatsApp ? TWILIO_WHATSAPP_FROM : TWILIO_SMS_FROM;

  if (!TWILIO_SID || !TWILIO_TOKEN || !from) {
    console.log(`[QueueBook ${channel}] to=${to} :: ${body.split('\n').join(' | ')}`);
    return { ok: true, provider: 'console', messageId: '' };
  }

  const recipient = useWhatsApp && !/^whatsapp:/.test(to) ? `whatsapp:${to}` : to;
  const sender = useWhatsApp && !/^whatsapp:/.test(from) ? `whatsapp:${from}` : from;

  const form = new URLSearchParams({ From: sender, To: recipient, Body: body });
  const auth = 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, provider: 'twilio', messageId: '', error: data.message || 'Twilio error' };
    }
    return { ok: true, provider: 'twilio', messageId: data.sid };
  } catch (err) {
    return { ok: false, provider: 'twilio', messageId: '', error: err.message };
  }
}

function logMessage({ user, business, queue, appointment, channel, to, type, content, status, provider, providerMessageId, error }) {
  return MessageLog.create({
    user: user?._id,
    business: business?._id || business,
    queue: queue?._id || queue,
    appointment: appointment?._id || appointment,
    channel,
    to: to || '',
    type,
    content: content || '',
    status,
    provider: provider || 'console',
    providerMessageId: providerMessageId || '',
    error: error || '',
  }).catch((err) => console.error('MessageLog create error:', err.message));
}

async function createInAppNotification({ user, title, message, type, data }) {
  if (!user?._id) return null;
  const notification = await Notification.create({
    user: user._id,
    title,
    message,
    type: type === 'appointment' ? 'appointment' : 'queue',
    data: data || {},
  }).catch((err) => console.error('Notification create error:', err.message));

  if (notification) {
    emitToUser(user._id, 'new-notification', notification.toObject());
  }
  return notification;
}

/**
 * Send in-app + push (mobile & browser) notifications, then log SMS delivery.
 * The in-app Notification channel is always kept; SMS/WhatsApp is sent only to
 * the user's own verified phone number.
 */
async function notifyUser({ user, business, queue, appointment, type, templateData, channel }) {
  const safeChannel = channel || SMS_CHANNEL;
  const title = TITLES[type] || 'QueueBook';
  const body = TEMPLATES[type]?.(templateData || {}) || '';

  await createInAppNotification({
    user,
    title,
    message: body,
    type,
    data: {
      queue: queue?._id,
      business: business?._id,
      appointment: appointment?._id,
      channel: safeChannel,
    },
  });

  const pushData = {
    queue: queue?._id,
    business: business?._id,
    appointment: appointment?._id,
    type,
  };
  await sendUserPush(user, { title, body, data: pushData }).catch((err) => {
    console.error('Push notification error:', err.message);
  });

  const phone = user?.phone;
  if (!phone) {
    await logMessage({
      user, business, queue, appointment,
      channel: safeChannel,
      to: '',
      type,
      content: body,
      status: 'failed',
      provider: 'none',
      error: 'No verified phone number on profile',
    });
    return { ok: false, error: 'No phone number' };
  }

  const result = await sendViaProvider({ to: phone, body, channel: safeChannel });

  await logMessage({
    user, business, queue, appointment,
    channel: safeChannel,
    to: phone,
    type,
    content: body,
    status: result.ok ? 'sent' : 'failed',
    provider: result.provider,
    providerMessageId: result.messageId,
    error: result.error,
  });

  return result;
}

module.exports = {
  notifyUser,
  createInAppNotification,
  sendViaProvider,
  logMessage,
  TEMPLATES,
  TITLES,
  formatDate,
};
