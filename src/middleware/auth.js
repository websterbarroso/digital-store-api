/**
 * Middleware de autenticação: exige o cabeçalho "Authorization: Bearer <jwt>".
 * Usado nas rotas POST, PUT e DELETE protegidas.
 */
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const AppError = require('../utils/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Token de autorização não enviado'));
  }

  try {
    const payload = jwt.verify(token, authConfig.secret);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (err) {
    return next(AppError.unauthorized('Token de autorização inválido ou expirado'));
  }
}

module.exports = authenticate;
