const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket/queueHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
  : 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

app.use('/api/customer', require('./routes/customer'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/business', require('./routes/business'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

setupSocket(io);

module.exports = { io, app, server };

const PORT = process.env.PORT || 5000;

connectDB().finally(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
