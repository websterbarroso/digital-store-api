const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

/** Recria o banco em memória. */
async function resetDatabase() {
  await sequelize.sync({ force: true });
}

/** Cria um usuário e retorna um token JWT válido. */
async function createUserAndToken(email = 'tester@mail.com') {
  await request(app).post('/v1/user').send({
    firstname: 'Test',
    surname: 'User',
    email,
    password: '123@123',
    confirmPassword: '123@123',
  });
  const res = await request(app).post('/v1/user/token').send({ email, password: '123@123' });
  return res.body.token;
}

// PNG 1x1 em base64
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

module.exports = {
  app, request, sequelize, resetDatabase, createUserAndToken, PNG_BASE64,
};
