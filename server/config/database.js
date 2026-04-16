const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const defaultSqlitePath = path.join(__dirname, '..', 'data', 'database.sqlite');
const parseCsv = (value, fallback = []) => {
    if (!value) {
        return fallback;
    }
    return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
};

// Конфигурация для сервера (SQLITE_PATH — путь к БД; по умолчанию server/data/database.sqlite)
const config = {
    port: Number(process.env.PORT) || 5000,
    dbHost: process.env.DB_HOST || 'localhost',
    dbPath: process.env.SQLITE_PATH || defaultSqlitePath,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpire: '30d',
    jwtCookieExpire: 30,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: parseCsv(process.env.CORS_ORIGINS, ['http://localhost:5174']),
    socketCorsOrigins: parseCsv(process.env.SOCKET_CORS_ORIGINS, ['http://localhost:5174'])
};

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.dbPath,
    host: config.dbHost,
    logging: false
});

module.exports = { sequelize, config }; 