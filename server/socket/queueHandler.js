const Queue = require('../models/Queue');
const { getTodayRange } = require('../utils/helpers');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-business-room', (businessId) => {
      socket.join(`business:${businessId}`);
    });

    socket.on('join-queue-room', (queueId) => {
      socket.join(`queue:${queueId}`);
    });

    socket.on('queue-update', async (data) => {
      const { businessId } = data;
      const { start, end } = getTodayRange();
      const queue = await Queue.find({
        business: businessId,
        queueDate: { $gte: start, $lte: end },
        status: { $in: ['waiting', 'called'] },
      })
        .populate('user', 'name')
        .sort({ tokenNumber: 1 });

      io.to(`business:${businessId}`).emit('queue-refresh', queue);

      for (const entry of queue) {
        const peopleAhead = queue.filter(
          (q) => q.tokenNumber < entry.tokenNumber && q.status === 'waiting'
        ).length;
        io.to(`queue:${entry._id}`).emit('position-update', {
          queueId: entry._id,
          currentToken: queue.find((q) => q.status === 'called')?.tokenNumber || null,
          yourToken: entry.tokenNumber,
          peopleAhead,
          estimatedWaitTime: peopleAhead * 5,
        });
      }
    });

    socket.on('call-next', async (data) => {
      const { businessId } = data;
      io.to(`business:${businessId}`).emit('next-called', { called: true });
    });

    socket.on('new-booking', async (data) => {
      const { businessId } = data;
      io.to(`business:${businessId}`).emit('booking-notification', {
        message: 'New booking received',
        timestamp: new Date(),
      });
      const { start, end } = getTodayRange();
      const queue = await Queue.find({
        business: businessId,
        queueDate: { $gte: start, $lte: end },
        status: { $in: ['waiting', 'called'] },
      })
        .populate('user', 'name')
        .sort({ tokenNumber: 1 });
      io.to(`business:${businessId}`).emit('queue-refresh', queue);
    });
  });
};

module.exports = setupSocket;
