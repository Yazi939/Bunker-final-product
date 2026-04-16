const socketIO = require('socket.io');
const { config } = require('./config/database');

let io;

const init = (server) => {
  if (!io) {
    io = socketIO(server, {
      cors: {
        origin: config.nodeEnv === 'production' ? config.socketCorsOrigins : true,
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      socket.join('transactions');
      console.log(`Client ${socket.id} joined transactions room`);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO не инициализирован');
  }
  return io;
};

module.exports = {
  init,
  getIO
}; 