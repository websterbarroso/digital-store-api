/**
 * Funções auxiliares para tratar query strings de busca (limit, page, fields...).
 */
const AppError = require('./AppError');

/** Converte "limit" e "page" em números válidos. limit=-1 busca todos os itens. */
function parsePagination(query) {
  const limit = query.limit === undefined || query.limit === '' ? 12 : Number(query.limit);
  const page = query.page === undefined || query.page === '' ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1)) {
    throw AppError.badRequest('O parâmetro "limit" deve ser um inteiro positivo ou -1');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw AppError.badRequest('O parâmetro "page" deve ser um inteiro maior ou igual a 1');
  }

  const options = limit === -1 ? {} : { limit, offset: (page - 1) * limit };
  return { limit, page, options };
}

/** Converte "a,b,c" em ["a", "b", "c"] (ignorando itens vazios). */
function parseList(value) {
  if (value === undefined || value === null || value === '') return [];
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

/** Converte "1,2,3" em [1, 2, 3]; lança 400 se algum item não for inteiro. */
function parseIntList(value, name) {
  const list = parseList(value).map(Number);
  if (list.some((n) => !Number.isInteger(n))) {
    throw AppError.badRequest(`O parâmetro "${name}" deve conter apenas números inteiros separados por vírgula`);
  }
  return list;
}

/** Retorna somente os campos solicitados em "fields" (ou o objeto inteiro). */
function pickFields(obj, fields) {
  if (!fields || fields.length === 0) return obj;
  return fields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(obj, field)) acc[field] = obj[field];
    return acc;
  }, {});
}

/** Converte "true"/"1"/true em booleano. Retorna undefined se não informado. */
function parseBoolean(value) {
  if (value === undefined || value === '') return undefined;
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  throw AppError.badRequest('Valor booleano inválido');
}

module.exports = { parsePagination, parseList, parseIntList, pickFields, parseBoolean };
