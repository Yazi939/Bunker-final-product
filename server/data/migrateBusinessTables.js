const { sequelize } = require('../config/database');

/**
 * Старые SQLite-таблицы без колонок под текущие модели Sequelize.
 * sync() не добавляет колонки в существующие таблицы.
 */
async function migrateBusinessTables() {
  const getColumnNames = async (table) => {
    const [cols] = await sequelize.query(`PRAGMA table_info(${table});`);
    return new Set(cols.map((c) => c.name));
  };

  const addColumnIfMissing = async (table, columnName, ddlSuffix) => {
    const names = await getColumnNames(table);
    if (names.has(columnName)) return;
    await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "${columnName}" ${ddlSuffix};`);
    console.log(`Миграция ${table}: добавлена колонка ${columnName}.`);
  };

  const [fuelExists] = await sequelize.query(
    "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name='FuelTransactions';",
  );
  if (fuelExists[0]?.cnt) {
    await addColumnIfMissing('FuelTransactions', 'type', "VARCHAR(255) DEFAULT 'purchase'");
    await addColumnIfMissing('FuelTransactions', 'volume', 'REAL');
    await addColumnIfMissing('FuelTransactions', 'source', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'destination', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'supplier', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'customer', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'vessel', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'bunkerVessel', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'paymentMethod', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'userRole', 'VARCHAR(255)');
    await addColumnIfMissing('FuelTransactions', 'timestamp', 'BIGINT');
    await addColumnIfMissing('FuelTransactions', 'frozen', 'TINYINT(1) DEFAULT 0');

    const fNames = await getColumnNames('FuelTransactions');
    if (fNames.has('amount') && fNames.has('volume')) {
      await sequelize.query(
        'UPDATE FuelTransactions SET volume = amount WHERE volume IS NULL AND amount IS NOT NULL;',
      );
    }
    await sequelize.query(
      `UPDATE FuelTransactions SET timestamp = CAST(strftime('%s', COALESCE(createdAt, datetime('now'))) AS INTEGER) * 1000
       WHERE timestamp IS NULL;`,
    );
  }

  const [shiftExists] = await sequelize.query(
    "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name='Shifts';",
  );
  if (shiftExists[0]?.cnt) {
    await addColumnIfMissing('Shifts', 'employeeName', "VARCHAR(255) DEFAULT ''");
    await addColumnIfMissing('Shifts', 'date', 'VARCHAR(255)');
    await addColumnIfMissing('Shifts', 'timestamp', 'BIGINT');
    await addColumnIfMissing('Shifts', 'shiftType', "VARCHAR(255) DEFAULT 'day'");
    await addColumnIfMissing('Shifts', 'fuelSaved', 'REAL DEFAULT 0');
    await addColumnIfMissing('Shifts', 'fuelPrice', 'REAL DEFAULT 0');
    await addColumnIfMissing('Shifts', 'bonus', 'REAL DEFAULT 0');
    await addColumnIfMissing('Shifts', 'baseSalary', 'REAL DEFAULT 0');
    await addColumnIfMissing('Shifts', 'totalSalary', 'REAL DEFAULT 0');

    const shiftColumns = await getColumnNames('Shifts');
    const hasStartDate = shiftColumns.has('startDate');
    const hasCreatedAt = shiftColumns.has('createdAt');
    const hasStartFuel = shiftColumns.has('startFuel');
    const hasEndFuel = shiftColumns.has('endFuel');

    await sequelize.query(
      `UPDATE Shifts SET employeeName = 'Сотрудник' WHERE employeeName IS NULL OR TRIM(employeeName) = '';`,
    );

    if (hasStartDate && hasCreatedAt) {
      await sequelize.query(`
        UPDATE Shifts SET date = CASE
          WHEN startDate IS NOT NULL AND length(CAST(startDate AS TEXT)) >= 10 THEN substr(CAST(startDate AS TEXT), 1, 10)
          ELSE strftime('%Y-%m-%d', COALESCE(createdAt, datetime('now')))
        END
        WHERE date IS NULL OR TRIM(COALESCE(date, '')) = '';
      `);
    } else if (hasStartDate) {
      await sequelize.query(`
        UPDATE Shifts SET date = substr(CAST(startDate AS TEXT), 1, 10)
        WHERE (date IS NULL OR TRIM(COALESCE(date, '')) = '')
          AND startDate IS NOT NULL
          AND length(CAST(startDate AS TEXT)) >= 10;
      `);
    } else if (hasCreatedAt) {
      await sequelize.query(`
        UPDATE Shifts SET date = strftime('%Y-%m-%d', COALESCE(createdAt, datetime('now')))
        WHERE date IS NULL OR TRIM(COALESCE(date, '')) = '';
      `);
    } else {
      await sequelize.query(`
        UPDATE Shifts SET date = strftime('%Y-%m-%d', datetime('now'))
        WHERE date IS NULL OR TRIM(COALESCE(date, '')) = '';
      `);
    }

    if (hasCreatedAt) {
      await sequelize.query(`
        UPDATE Shifts SET timestamp = CAST(strftime('%s', COALESCE(createdAt, datetime('now'))) AS INTEGER) * 1000
        WHERE timestamp IS NULL;
      `);
    } else {
      await sequelize.query(`
        UPDATE Shifts SET timestamp = CAST(strftime('%s', datetime('now')) AS INTEGER) * 1000
        WHERE timestamp IS NULL;
      `);
    }
    await sequelize.query(`
      UPDATE Shifts SET shiftType = 'day' WHERE shiftType IS NULL OR TRIM(COALESCE(shiftType, '')) = '';
    `);
    if (hasStartFuel && hasEndFuel) {
      await sequelize.query(`
        UPDATE Shifts SET fuelSaved = ABS(COALESCE(endFuel, 0) - COALESCE(startFuel, 0))
        WHERE (fuelSaved IS NULL OR fuelSaved = 0) AND (startFuel IS NOT NULL OR endFuel IS NOT NULL);
      `);
    }
    await sequelize.query(`UPDATE Shifts SET fuelPrice = 0 WHERE fuelPrice IS NULL;`);
    await sequelize.query(`
      UPDATE Shifts SET baseSalary = CASE WHEN shiftType = 'night' THEN 6500 ELSE 5500 END
      WHERE baseSalary IS NULL OR baseSalary = 0;
    `);
    await sequelize.query(`
      UPDATE Shifts SET bonus = COALESCE(fuelSaved, 0) * COALESCE(fuelPrice, 0) WHERE bonus IS NULL;
    `);
    await sequelize.query(`
      UPDATE Shifts SET totalSalary = COALESCE(baseSalary, 0) + COALESCE(bonus, 0)
      WHERE totalSalary IS NULL OR totalSalary = 0;
    `);
  }
}

module.exports = migrateBusinessTables;
