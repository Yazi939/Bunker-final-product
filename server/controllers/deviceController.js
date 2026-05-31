const { AllowedDevice } = require('../models');
const { normalizeMac } = require('../utils/macUtils');

exports.getAllowedDevices = async (req, res) => {
  try {
    const devices = await AllowedDevice.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAllowedDevice = async (req, res) => {
  try {
    const normalizedMac = normalizeMac(req.body?.mac);
    if (!normalizedMac) {
      return res.status(400).json({ error: 'Некорректный MAC-адрес' });
    }

    const existing = await AllowedDevice.findOne({ where: { mac: normalizedMac } });
    if (existing) {
      return res.status(400).json({ error: 'Этот MAC уже добавлен в список' });
    }

    const device = await AllowedDevice.create({
      id: `device-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      mac: normalizedMac,
      label: req.body?.label || null,
      isActive: req.body?.isActive !== undefined ? Boolean(req.body.isActive) : true,
      userId: req.body?.userId || null,
      createdBy: req.user?.id || null,
    });

    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAllowedDevice = async (req, res) => {
  try {
    const device = await AllowedDevice.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Устройство не найдено' });
    }

    const updatePayload = {};
    if (req.body?.mac !== undefined) {
      const normalizedMac = normalizeMac(req.body.mac);
      if (!normalizedMac) {
        return res.status(400).json({ error: 'Некорректный MAC-адрес' });
      }
      const duplicate = await AllowedDevice.findOne({ where: { mac: normalizedMac } });
      if (duplicate && duplicate.id !== device.id) {
        return res.status(400).json({ error: 'Этот MAC уже добавлен в список' });
      }
      updatePayload.mac = normalizedMac;
    }
    if (req.body?.label !== undefined) {
      updatePayload.label = req.body.label || null;
    }
    if (req.body?.isActive !== undefined) {
      updatePayload.isActive = Boolean(req.body.isActive);
    }
    if (req.body?.userId !== undefined) {
      updatePayload.userId = req.body.userId || null;
    }

    await device.update(updatePayload);
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAllowedDevice = async (req, res) => {
  try {
    const device = await AllowedDevice.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Устройство не найдено' });
    }

    await device.update({ isActive: false });
    res.json({ success: true, message: 'Устройство деактивировано' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
