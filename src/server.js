/**
 * Ponto de entrada: verifica a conexão com o banco e sobe o servidor HTTP.
 */
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Banco de dados conectado (${sequelize.getDialect()})`);
  } catch (err) {
    console.error('Não foi possível conectar ao banco de dados:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Documentação em http://localhost:${PORT}/docs`);
  });
}

start();
