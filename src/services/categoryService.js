/**
 * Regras de negócio de categorias.
 */
const { Category } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, parseList, pickFields, parseBoolean } = require('../utils/query');

const PUBLIC_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

function toPublic(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    use_in_menu: Boolean(category.use_in_menu),
  };
}

/** GET /v1/category/search */
async function search(query = {}) {
  const { limit, page, options } = parsePagination(query);
  const fields = parseList(query.fields);

  const invalid = fields.filter((f) => !PUBLIC_FIELDS.includes(f));
  if (invalid.length) throw AppError.badRequest(`Campos inválidos em "fields": ${invalid.join(', ')}`);

  const where = {};
  const useInMenu = parseBoolean(query.use_in_menu);
  if (useInMenu !== undefined) where.use_in_menu = useInMenu;

  const { rows, count } = await Category.findAndCountAll({ where, order: [['id', 'ASC']], ...options });

  return {
    data: rows.map((c) => pickFields(toPublic(c), fields)),
    total: count,
    limit,
    page,
  };
}

async function findById(id) {
  const category = await Category.findByPk(id);
  if (!category) throw AppError.notFound('Categoria não encontrada');
  return toPublic(category);
}

/** Valida o payload de criação/atualização. "partial" permite campos ausentes. */
function validate(data, partial) {
  const errors = [];
  const values = {};

  ['name', 'slug'].forEach((field) => {
    if (data[field] === undefined && partial) return;
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      errors.push(`O campo "${field}" é obrigatório`);
    } else {
      values[field] = data[field].trim();
    }
  });

  if (values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
    errors.push('O "slug" deve conter apenas letras minúsculas, números e hífens');
  }

  if (data.use_in_menu !== undefined) {
    if (typeof data.use_in_menu !== 'boolean') errors.push('O campo "use_in_menu" deve ser booleano');
    else values.use_in_menu = data.use_in_menu;
  }

  if (partial && !errors.length && Object.keys(values).length === 0) {
    errors.push('Informe ao menos um campo para atualizar');
  }
  if (errors.length) throw AppError.badRequest('Dados da categoria inválidos', errors);
  return values;
}

async function create(data = {}) {
  const values = validate(data, false);
  const category = await Category.create(values);
  return toPublic(category);
}

async function update(id, data = {}) {
  const category = await Category.findByPk(id);
  if (!category) throw AppError.notFound('Categoria não encontrada');
  const values = validate(data, true);
  await category.update(values);
}

async function remove(id) {
  const deleted = await Category.destroy({ where: { id } });
  if (!deleted) throw AppError.notFound('Categoria não encontrada');
}

module.exports = { search, findById, create, update, remove };
