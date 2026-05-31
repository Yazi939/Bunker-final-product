const { sequelize } = require('../config/database');

async function migrateAllowedDevices() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "AllowedDevices" (
      "id" VARCHAR(255) PRIMARY KEY,
      "mac" VARCHAR(255) NOT NULL UNIQUE,
      "label" VARCHAR(255),
      "isActive" TINYINT(1) DEFAULT 1,
      "userId" VARCHAR(255),
      "createdBy" VARCHAR(255),
      "createdAt" DATETIME,
      "updatedAt" DATETIME
    );
  `);

  const [cols] = await sequelize.query('PRAGMA table_info(AllowedDevices);');
  const names = new Set(cols.map((c) => c.name));

  const addColumnIfMissing = async (columnName, ddlSuffix) => {
    if (names.has(columnName)) return;
    await sequelize.query(
      `ALTER TABLE "AllowedDevices" ADD COLUMN "${columnName}" ${ddlSuffix};`,
    );
    console.log(`Миграция AllowedDevices: добавлена колонка ${columnName}.`);
  };

  await addColumnIfMissing('label', 'VARCHAR(255)');
  await addColumnIfMissing('isActive', 'TINYINT(1) DEFAULT 1');
  await addColumnIfMissing('userId', 'VARCHAR(255)');
  await addColumnIfMissing('createdBy', 'VARCHAR(255)');
  await addColumnIfMissing('createdAt', 'DATETIME');
  await addColumnIfMissing('updatedAt', 'DATETIME');

  await sequelize.query(
    `UPDATE "AllowedDevices" SET "isActive" = 1 WHERE "isActive" IS NULL;`,
  );
  await sequelize.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "allowed_devices_mac_unique_idx" ON "AllowedDevices" ("mac");`,
  );
}

module.exports = migrateAllowedDevices;
