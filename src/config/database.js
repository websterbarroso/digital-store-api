/**
 * Configuração do banco de dados.
 * Este arquivo é usado tanto pela aplicação quanto pelo sequelize-cli (migrations/seeders).
 *
 * - DB_DIALECT=mysql  -> usa MySQL (padrão do projeto)
 * - DB_DIALECT=sqlite -> usa um arquivo SQLite local (útil para rodar sem instalar MySQL)
 * - NODE_ENV=test     -> sempre usa SQLite em memória (testes com Jest)
 */
require('dotenv').config();
const path = require('path');

// Opções comuns a todos os ambientes
const common = {
  logging: false,
  define: {
    underscored: true, // created_at / updated_at / product_id ...
    timestamps: true,
  },
};

function buildConfig() {
  const dialect = process.env.DB_DIALECT || 'mysql';

  if (dialect === 'sqlite') {
    return {
      ...common,
      dialect,
      storage: path.resolve(process.env.DB_STORAGE || './database.sqlite'),
    };
  }

  return {
    ...common,
    dialect,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'digital_store',
  };
}

module.exports = {
  development: buildConfig(),
  production: buildConfig(),
  test: {
    ...common,
    dialect: 'sqlite',
    storage: ':memory:',
  },
};
