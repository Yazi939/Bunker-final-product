const FuelTransaction = require('../models/FuelTransaction');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const { User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Демо-данные для презентации. Включение: SEED_DEMO_DATA=1 в server/.env
 */
async function seedDemoData() {
  if (process.env.SEED_DEMO_DATA !== '1' && process.env.SEED_DEMO_DATA !== 'true') {
    return;
  }

  try {
    const admin =
      (await User.findOne({ where: { username: process.env.SEED_ADMIN_USERNAME || 'admin' } })) ||
      (await User.findOne({ where: { role: 'admin' } }));
    if (!admin) {
      console.warn('Демо-сид: нет пользователя admin — пропуск.');
      return;
    }

    const userIdNum = typeof admin.id === 'number' ? admin.id : Number(admin.id);
    const userIdStr = String(admin.id);
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const fuelMarker = '920001';
    const existingFuel = await FuelTransaction.findByPk(fuelMarker);
    if (!existingFuel) {
      await FuelTransaction.bulkCreate([
        {
          id: fuelMarker,
          type: 'purchase',
          volume: 5000,
          price: 52.5,
          totalCost: 262500,
          fuelType: 'diesel',
          supplier: 'ООО «Нефтебаза Юг»',
          paymentMethod: 'transfer',
          notes: 'Демо: закупка для склада',
          timestamp: now - 86400000 * 3,
          date: today,
          userId: userIdNum,
          userRole: admin.role,
          createdAt: new Date(now - 86400000 * 3),
          updatedAt: new Date(now - 86400000 * 3),
        },
        {
          id: '920002',
          type: 'sale',
          volume: 1200,
          price: 68,
          totalCost: 81600,
          fuelType: 'diesel',
          customer: 'Судно «Морской волк»',
          vessel: 'Морской волк',
          paymentMethod: 'transfer',
          notes: 'Демо: отгрузка судну',
          timestamp: now - 86400000 * 2,
          date: today,
          userId: userIdNum,
          userRole: admin.role,
          createdAt: new Date(now - 86400000 * 2),
          updatedAt: new Date(now - 86400000 * 2),
        },
        {
          id: '920003',
          type: 'bunker_sale',
          volume: 800,
          price: 71,
          totalCost: 56800,
          fuelType: 'diesel',
          bunkerVessel: 'Бункеровщик-2',
          customer: 'Портовый клиент (демо)',
          paymentMethod: 'card',
          notes: 'Демо: бункеровка',
          timestamp: now - 86400000,
          date: today,
          userId: userIdNum,
          userRole: admin.role,
          createdAt: new Date(now - 86400000),
          updatedAt: new Date(now - 86400000),
        },
      ]);
      console.log('Демо-сид: добавлены транзакции топлива.');
    }

    if (!(await Order.findByPk('demo-order-1'))) {
      await Order.bulkCreate([
        {
          id: 'demo-order-1',
          customerName: 'ООО «Речфлот»',
          customerContact: '+7 900 000-00-01',
          vesselName: 'Буксир «Сигма»',
          fuelType: 'diesel',
          volume: 3500,
          price: 66,
          totalCost: 231000,
          status: 'pending',
          createdAt: new Date(now - 86400000 * 2).toISOString(),
          timestamp: now - 86400000 * 2,
          deliveryDate: today,
          deliveryTimestamp: now + 86400000,
          notes: 'Демо-заказ',
        },
        {
          id: 'demo-order-2',
          customerName: 'ИП Капитанов',
          customerContact: '+7 900 000-00-02',
          vesselName: 'Катер «Бриз»',
          fuelType: 'gasoline_95',
          volume: 400,
          price: 72,
          totalCost: 28800,
          status: 'completed',
          createdAt: new Date(now - 86400000 * 5).toISOString(),
          timestamp: now - 86400000 * 5,
          notes: 'Демо: выполнен',
        },
      ]);
      console.log('Демо-сид: добавлены заказы.');
    }

    if (!(await Expense.findByPk('demo-expense-1'))) {
      await Expense.bulkCreate([
        {
          id: 'demo-expense-1',
          type: 'Ремонт оборудования',
          category: 'maintenance',
          description: 'Демо: ТО насосной станции',
          amount: 18500,
          date: today,
          paymentMethod: 'transfer',
          supplier: 'СервисТех',
          userId: userIdStr,
          createdBy: admin.username || admin.name || 'admin',
          notes: 'Демо-расход',
          timestamp: now - 86400000 * 4,
          status: 'active',
        },
        {
          id: 'demo-expense-2',
          type: 'Коммунальные',
          category: 'utilities',
          description: 'Демо: электроэнергия склад',
          amount: 12400.5,
          date: today,
          paymentMethod: 'card',
          userId: userIdStr,
          createdBy: admin.username || admin.name || 'admin',
          timestamp: now - 86400000,
          status: 'active',
        },
      ]);
      console.log('Демо-сид: добавлены расходы.');
    }

    const [[{ demoShifts }]] = await sequelize.query(
      `SELECT COUNT(*) AS demoShifts FROM Shifts WHERE employeeName = 'Иванов А.П. (демо)';`,
    );
    if (Number(demoShifts) === 0) {
      await sequelize.query(
        `INSERT INTO Shifts (
          startDate, startFuel, endFuel, createdAt, updatedAt, userId,
          employeeName, date, timestamp, shiftType, fuelSaved, fuelPrice, bonus, baseSalary, totalSalary, notes
        ) VALUES
        (datetime('now'), 0, 0, datetime('now'), datetime('now'), :uid,
         'Иванов А.П. (демо)', :day, :ts1, 'day', 12.5, 800, 10000, 5500, 15500, 'Демо-смена дневная'),
        (datetime('now'), 0, 0, datetime('now'), datetime('now'), :uid,
         'Петров С.В. (демо)', :day, :ts2, 'night', 8, 750, 6000, 6500, 12500, 'Демо-смена ночная');`,
        {
          replacements: {
            uid: userIdNum,
            day: today,
            ts1: now - 86400000,
            ts2: now - 86400000 * 2,
          },
        },
      );
      console.log('Демо-сид: добавлены смены.');
    }
  } catch (e) {
    console.error('Демо-сид: ошибка:', e.message);
  }
}

module.exports = seedDemoData;
