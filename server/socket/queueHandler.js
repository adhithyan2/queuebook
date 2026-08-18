const jwt = require('jsonwebtoken');
const { computeQueueState } = require('../services/etaService');

let ioInstance = null;

const setupSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          socket.join(`user:${decoded.id}`);
        }
      }
    } catch (err) {
      // ignore invalid tokens; connection still works for public rooms
    }

    socket.on('join-business-room', (businessId) => {
      if (businessId) socket.join(`business:${businessId}`);
    });

    socket.on('join-public-room', (businessId) => {
      if (businessId) socket.join(`public:${businessId}`);
    });

    socket.on('join-queue-room', (queueId) => {
      if (queueId) socket.join(`queue:${queueId}`);
    });

    socket.on('queue-update', async (data) => {
      const { businessId } = data || {};
      if (!businessId) return;
      await broadcastQueueRefresh(businessId);
    });

    socket.on('call-next', async (data) => {
      const { businessId } = data || {};
      if (!businessId) return;
      await broadcastQueueRefresh(businessId);
    });

    socket.on('new-booking', async (data) => {
      const { businessId } = data || {};
      if (!businessId) return;
      emitToBusiness(businessId, 'booking-notification', {
        message: 'New booking received',
        timestamp: new Date(),
      });
      await broadcastQueueRefresh(businessId);
    });
  });
};

/**
 * Recompute the live queue state for a business and push it everywhere:
 *  - `queue-refresh`   → business room (full enriched queue array)
 *  - `queue-state`     → business room + public room (summary snapshot)
 *  - `position-update` → the queue's own room AND the customer's user room
 *                        (enriched per-customer payload)
 *  - `appointments-refresh` → business room
 */
async function broadcastQueueRefresh(businessId) {
  if (!ioInstance || !businessId) return;
  try {
    const state = await computeQueueState(businessId);

    ioInstance.to(`business:${businessId}`).emit('queue-refresh', state.queue || []);
    ioInstance.to(`business:${businessId}`).emit('queue-state', state);
    ioInstance.to(`public:${businessId}`).emit('queue-state', state);
    ioInstance.to(`business:${businessId}`).emit('appointments-refresh', {
      refresh: true,
      timestamp: new Date(),
    });

    for (const entry of state.queue || []) {
      const payload = { ...entry, businessId };
      if (entry.queueId) ioInstance.to(`queue:${entry.queueId}`).emit('position-update', payload);
      if (entry.userId) ioInstance.to(`user:${entry.userId}`).emit('position-update', payload);
    }
  } catch (err) {
    console.error('broadcastQueueRefresh error:', err.message);
  }
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

function emitToBusiness(businessId, event, payload) {
  if (!ioInstance || !businessId) return;
  ioInstance.to(`business:${businessId}`).emit(event, payload);
}

module.exports = setupSocket;
module.exports.emitToUser = emitToUser;
module.exports.emitToBusiness = emitToBusiness;
module.exports.broadcastQueueRefresh = broadcastQueueRefresh;
