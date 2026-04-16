const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../config/database');

const DEFAULT_USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

async function usersColumnSet() {
  const [cols] = await sequelize.query('PRAGMA table_info(Users);');
  return new Set(cols.map((c) => c.name));
}

const seedUsers = async () => {
  try {
    const cols = await usersColumnSet();
    if (!cols.size) {
      return;
    }

    const [found] = await sequelize.query('SELECT 1 FROM Users WHERE username = ? LIMIT 1', {
      replacements: [DEFAULT_USERNAME],
    });
    if (found.length) {
      return;
    }

    console.log('Создание администратора по умолчанию...');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    if (cols.has('email')) {
      const [[{ nextId }]] = await sequelize.query(
        'SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM Users',
      );
      const email = `${DEFAULT_USERNAME}@local.seed`;
      const replacements = [nextId, 'Администратор', email, hash, 'admin', DEFAULT_USERNAME];
      if (cols.has('createdAt') && cols.has('updatedAt')) {
        await sequelize.query(
          `INSERT INTO Users (id, name, email, password, role, username, lastSync, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
          { replacements },
        );
      } else {
        await sequelize.query(
          `INSERT INTO Users (id, name, email, password, role, username, lastSync)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          { replacements },
        );
      }
    } else {
      const id = `${Date.now()}${Math.random().toString(36).slice(2, 11)}`;
      await User.create({
        id,
        username: DEFAULT_USERNAME,
        password: DEFAULT_PASSWORD,
        name: 'Администратор',
        role: 'admin',
      });
    }

    console.log(
      `Вход: логин «${DEFAULT_USERNAME}», пароль «${DEFAULT_PASSWORD}» (смените в продакшене).`,
    );
  } catch (error) {
    console.error('Ошибка при создании пользователя по умолчанию:', error);
  }
};

module.exports = seedUsers;
