const { sequelize } = require('../config/database');

/**
 * Старая SQLite-схема: email, без username / lastSync.
 * sync() не добавляет колонки в существующую таблицу.
 */
async function migrateUsersSchema() {
  const [existsRows] = await sequelize.query(
    "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name='Users';",
  );
  if (!existsRows[0]?.cnt) {
    return;
  }

  const [cols] = await sequelize.query('PRAGMA table_info(Users);');
  const names = new Set(cols.map((c) => c.name));

  if (!names.has('username')) {
    await sequelize.query('ALTER TABLE Users ADD COLUMN username VARCHAR(255);');
    if (names.has('email')) {
      await sequelize.query(
        'UPDATE Users SET username = email WHERE username IS NULL OR username = "";',
      );
    }
    console.log('Миграция Users: добавлена колонка username (из email).');
  }

  if (!names.has('lastSync')) {
    await sequelize.query('ALTER TABLE Users ADD COLUMN lastSync DATETIME;');
    await sequelize.query(
      "UPDATE Users SET lastSync = datetime('now') WHERE lastSync IS NULL;",
    );
    console.log('Миграция Users: добавлена колонка lastSync.');
  }
}

module.exports = migrateUsersSchema;
