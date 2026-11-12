/**
 * Configurações do JWT.
 */
require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'digital-store-dev-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
