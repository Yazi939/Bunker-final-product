const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createServer } = require('http');
const { sequelize, config } = require('./config/database');
const cookieParser = require('cookie-parser');
const socket = require('./socket');

// Импорт маршрутов
const userRoutes = require('./routes/userRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const orderRoutes = require('./routes/orderRoutes');
const healthRoutes = require('./routes/healthRoutes');
const sync = require('./routes/sync');
const fuelRoutes = require('./routes/fuelRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const seedUsers = require('./data/seedUsers');
const seedDemoData = require('./data/seedDemo');
const migrateUsersSchema = require('./data/migrateUsersSchema');
const migrateBusinessTables = require('./data/migrateBusinessTables');
const migrateAllowedDevices = require('./data/migrateAllowedDevices');

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Инициализация Socket.IO
socket.init(httpServer);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Маршруты
app.use('/api/shifts', shiftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/sync', sync);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/devices', deviceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

// Инициализация базы данных
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite подключена успешно');
    
    await sequelize.sync();
    console.log('Модели синхронизированы с базой данных');

    await migrateUsersSchema();
    await migrateBusinessTables();
    await migrateAllowedDevices();
    await seedUsers();
    await seedDemoData();
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
};

// Инициализация приложения
const initApp = async () => {
  try {
    await initializeDatabase();
    
    // Запуск сервера
    httpServer.listen(config.port, '0.0.0.0', () => {
      console.log(`Сервер запущен на порту ${config.port}`);
    });
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    process.exit(1);
  }
};

// Запускаем приложение только если файл запущен напрямую
if (require.main === module) {
  initApp();
}

// Обработка необработанных ошибок
process.on('uncaughtException', (err) => {
  console.error('Необработанная ошибка:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный rejection:', reason);
});

// Экспортируем только необходимые компоненты
module.exports = {
  app,
  httpServer,
  config
}; 