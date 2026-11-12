/**
 * Middlewares de tratamento de erros.
 * Converte qualquer erro lançado em uma resposta JSON com o status HTTP correto.
 */
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');

/** Rota não encontrada (404). */
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Rota ${req.method} ${req.originalUrl} não encontrada`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(400).json({
      message: 'Registro duplicado',
      details: err.errors.map((e) => `${e.path} já está em uso`),
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({ message: 'Dados inválidos', details: err.errors.map((e) => e.message) });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: 'Referência inválida para outro registro' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(400).json({ message: 'Corpo da requisição muito grande' });
  }

  // Erro inesperado: registra no console e não expõe detalhes internos
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
