/**
 * Regras de negócio de usuários: cadastro, consulta, atualização, remoção e login (JWT).
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authConfig = require('../config/auth');
const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formato público do usuário (nunca retorna a senha). */
function toPublic(user) {
  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    email: user.email,
  };
}

function isFilledString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function findById(id) {
  const user = await User.findByPk(id);
  if (!user) throw AppError.notFound('Usuário não encontrado');
  return toPublic(user);
}

async function create(data = {}) {
  const errors = [];
  ['firstname', 'surname', 'email', 'password', 'confirmPassword'].forEach((field) => {
    if (!isFilledString(data[field])) errors.push(`O campo "${field}" é obrigatório`);
  });
  if (isFilledString(data.email) && !EMAIL_REGEX.test(data.email)) errors.push('E-mail inválido');
  if (isFilledString(data.password) && data.password !== data.confirmPassword) {
    errors.push('A senha e a confirmação de senha não conferem');
  }
  if (errors.length) throw AppError.badRequest('Dados do usuário inválidos', errors);

  const exists = await User.findOne({ where: { email: data.email.trim().toLowerCase() } });
  if (exists) throw AppError.badRequest('Já existe um usuário com este e-mail');

  const user = await User.create({
    firstname: data.firstname.trim(),
    surname: data.surname.trim(),
    email: data.email.trim().toLowerCase(),
    password: await bcrypt.hash(data.password, 10),
  });
  return toPublic(user);
}

async function update(id, data = {}) {
  const user = await User.findByPk(id);
  if (!user) throw AppError.notFound('Usuário não encontrado');

  const changes = {};
  const errors = [];
  ['firstname', 'surname', 'email'].forEach((field) => {
    if (data[field] === undefined) return;
    if (!isFilledString(data[field])) errors.push(`O campo "${field}" não pode ser vazio`);
    else changes[field] = data[field].trim();
  });

  if (changes.email) {
    changes.email = changes.email.toLowerCase();
    if (!EMAIL_REGEX.test(changes.email)) errors.push('E-mail inválido');
  }
  if (!errors.length && Object.keys(changes).length === 0) {
    errors.push('Informe ao menos um dos campos: firstname, surname ou email');
  }
  if (errors.length) throw AppError.badRequest('Dados do usuário inválidos', errors);

  if (changes.email && changes.email !== user.email) {
    const exists = await User.findOne({ where: { email: changes.email } });
    if (exists) throw AppError.badRequest('Já existe um usuário com este e-mail');
  }

  await user.update(changes);
}

async function remove(id) {
  const deleted = await User.destroy({ where: { id } });
  if (!deleted) throw AppError.notFound('Usuário não encontrado');
}

/** Valida e-mail e senha e devolve um token JWT. */
async function generateToken({ email, password } = {}) {
  if (!isFilledString(email) || !isFilledString(password)) {
    throw AppError.badRequest('Informe e-mail e senha');
  }

  const user = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } });
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) throw AppError.badRequest('E-mail ou senha incorretos');

  const token = jwt.sign({ id: user.id, email: user.email }, authConfig.secret, {
    expiresIn: authConfig.expiresIn,
  });
  return { token };
}

module.exports = { findById, create, update, remove, generateToken };
