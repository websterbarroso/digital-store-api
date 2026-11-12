/**
 * Garante que o parâmetro ":id" da rota seja um inteiro positivo.
 * IDs inválidos (ex.: "abc") retornam 404, pois o recurso não pode existir.
 */
const AppError = require('../utils/AppError');

function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next(AppError.notFound('Recurso não encontrado'));
  req.params.id = id;
  return next();
}

module.exports = validateId;
