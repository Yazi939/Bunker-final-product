const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AllowedDevice = sequelize.define(
  'AllowedDevice',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    mac: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'AllowedDevices',
  },
);

module.exports = AllowedDevice;
