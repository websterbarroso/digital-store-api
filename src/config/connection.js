/**
 * Cria a instância única do Sequelize de acordo com o ambiente (NODE_ENV).
 */
const { Sequelize } = require('sequelize');
const dbConfig = require('./database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = config.dialect === 'sqlite'
  ? new Sequelize({ ...config })
  : new Sequelize(config.database, config.username, config.password, config);

module.exports = sequelize;
