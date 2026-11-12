/**
 * Regras de negócio de produtos: busca com filtros, consulta, criação,
 * atualização (incluindo imagens, opções e categorias) e remoção.
 */
const { Op } = require('sequelize');
const {
  sequelize, Product, ProductImage, ProductOption, ProductCategory, Category,
} = require('../models');
const AppError = require('../utils/AppError');
const imageStorage = require('./imageStorage');
const {
  parsePagination, parseList, parseIntList, pickFields,
} = require('../utils/query');

const PUBLIC_FIELDS = [
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'category_ids', 'images', 'options',
];

const INCLUDES = [
  { model: ProductImage, as: 'images', attributes: ['id', 'path'] },
  { model: ProductOption, as: 'options' },
  { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
];

// ---------------------------------------------------------------------------
// Formatação da resposta
// ---------------------------------------------------------------------------

function toPublic(product) {
  const p = product.get({ plain: true });
  return {
    id: p.id,
    enabled: Boolean(p.enabled),
    name: p.name,
    slug: p.slug,
    use_in_menu: Boolean(p.use_in_menu),
    stock: p.stock,
    description: p.description,
    price: p.price,
    price_with_discount: p.price_with_discount,
    category_ids: (p.categories || []).map((c) => c.id).sort((a, b) => a - b),
    images: (p.images || [])
      .sort((a, b) => a.id - b.id)
      .map((img) => ({ id: img.id, content: imageStorage.toUrl(img.path) })),
    options: (p.options || [])
      .sort((a, b) => a.id - b.id)
      .map((o) => ({
        id: o.id,
        title: o.title,
        shape: o.shape,
        radius: o.radius,
        type: o.type,
        values: o.values.split(',').filter(Boolean),
      })),
  };
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

/** Converte "100-200" em [100, 200]. */
function parsePriceRange(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (!match) throw AppError.badRequest('O parâmetro "price-range" deve seguir o formato "min-max" (ex.: 100-200)');
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (min > max) throw AppError.badRequest('No "price-range" o valor mínimo deve ser menor que o máximo');
  return [min, max];
}

/** Condição SQL para encontrar um valor dentro de uma lista "a,b,c". */
function valueInListCondition(value) {
  return {
    [Op.or]: [
      { values: value },
      { values: { [Op.like]: `${value},%` } },
      { values: { [Op.like]: `%,${value}` } },
      { values: { [Op.like]: `%,${value},%` } },
    ],
  };
}

/** Interseção de listas de IDs (null = sem restrição). */
function intersect(current, ids) {
  if (current === null) return ids;
  const set = new Set(ids);
  return current.filter((id) => set.has(id));
}

/** GET /v1/product/search */
async function search(query = {}) {
  const { limit, page, options } = parsePagination(query);
  const fields = parseList(query.fields);

  const invalid = fields.filter((f) => !PUBLIC_FIELDS.includes(f));
  if (invalid.length) throw AppError.badRequest(`Campos inválidos em "fields": ${invalid.join(', ')}`);

  const where = {};
  let restrictIds = null; // IDs permitidos pelos filtros de categoria/opção

  // match: termo no nome ou na descrição
  if (query.match) {
    const term = `%${String(query.match).trim()}%`;
    where[Op.or] = [{ name: { [Op.like]: term } }, { description: { [Op.like]: term } }];
  }

  // category_ids: produtos de qualquer uma das categorias informadas
  if (query.category_ids !== undefined) {
    const categoryIds = parseIntList(query.category_ids, 'category_ids');
    if (categoryIds.length) {
      const links = await ProductCategory.findAll({
        attributes: ['product_id'],
        where: { category_id: { [Op.in]: categoryIds } },
        raw: true,
      });
      restrictIds = intersect(restrictIds, [...new Set(links.map((l) => l.product_id))]);
    }
  }

  // price-range: janela de preço (considera o preço final, com desconto)
  if (query['price-range'] !== undefined) {
    const [min, max] = parsePriceRange(query['price-range']);
    where.price_with_discount = { [Op.between]: [min, max] };
  }

  // option[ID]=valor1,valor2: produtos que possuem algum dos valores na opção ID
  if (query.option !== undefined) {
    if (typeof query.option !== 'object' || Array.isArray(query.option)) {
      throw AppError.badRequest('Use o formato option[ID]=valor1,valor2');
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const [optionId, rawValues] of Object.entries(query.option)) {
      if (!Number.isInteger(Number(optionId))) throw AppError.badRequest('O ID da opção deve ser um número inteiro');
      const values = parseList(rawValues);
      // eslint-disable-next-line no-continue
      if (!values.length) continue;
      // eslint-disable-next-line no-await-in-loop
      const rows = await ProductOption.findAll({
        attributes: ['product_id'],
        where: { id: Number(optionId), [Op.or]: values.map(valueInListCondition) },
        raw: true,
      });
      restrictIds = intersect(restrictIds, rows.map((r) => r.product_id));
    }
  }

  if (restrictIds !== null) where.id = { [Op.in]: restrictIds };

  const { rows, count } = await Product.findAndCountAll({
    where,
    include: INCLUDES,
    distinct: true, // conta produtos, não linhas do JOIN
    order: [['id', 'ASC']],
    ...options,
  });

  return {
    data: rows.map((p) => pickFields(toPublic(p), fields)),
    total: count,
    limit,
    page,
  };
}

async function findById(id) {
  const product = await Product.findByPk(id, { include: INCLUDES });
  if (!product) throw AppError.notFound('Produto não encontrado');
  return toPublic(product);
}

// ---------------------------------------------------------------------------
// Validação do payload
// ---------------------------------------------------------------------------

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Aceita radius como número (4) ou string ("4px"). */
function parseRadius(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) || n < 0 ? NaN : n;
}

/** Valida os campos simples do produto. "partial" permite campos ausentes (PUT). */
function validateProductFields(data, partial) {
  const errors = [];
  const values = {};

  ['name', 'slug'].forEach((field) => {
    if (data[field] === undefined && partial) return;
    if (typeof data[field] !== 'string' || !data[field].trim()) errors.push(`O campo "${field}" é obrigatório`);
    else values[field] = data[field].trim();
  });
  if (values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
    errors.push('O "slug" deve conter apenas letras minúsculas, números e hífens');
  }

  ['price', 'price_with_discount'].forEach((field) => {
    if (data[field] === undefined && partial) return;
    if (!isNumber(data[field]) || data[field] < 0) errors.push(`O campo "${field}" deve ser um número maior ou igual a 0`);
    else values[field] = data[field];
  });

  ['enabled', 'use_in_menu'].forEach((field) => {
    if (data[field] === undefined) return;
    if (typeof data[field] !== 'boolean') errors.push(`O campo "${field}" deve ser booleano`);
    else values[field] = data[field];
  });

  if (data.stock !== undefined) {
    if (!Number.isInteger(data.stock) || data.stock < 0) errors.push('O campo "stock" deve ser um inteiro maior ou igual a 0');
    else values.stock = data.stock;
  }

  if (data.description !== undefined) {
    if (data.description !== null && typeof data.description !== 'string') errors.push('O campo "description" deve ser texto');
    else values.description = data.description;
  }

  if (data.category_ids !== undefined
    && (!Array.isArray(data.category_ids) || data.category_ids.some((id) => !Number.isInteger(id)))) {
    errors.push('O campo "category_ids" deve ser uma lista de IDs inteiros');
  }
  if (data.images !== undefined && !Array.isArray(data.images)) errors.push('O campo "images" deve ser uma lista');
  if (data.options !== undefined && !Array.isArray(data.options)) errors.push('O campo "options" deve ser uma lista');

  return { values, errors };
}

/** Normaliza uma opção do payload (aceita "values" ou "value"). */
function normalizeOption(option, isNew) {
  const errors = [];
  const values = {};
  const list = option.values !== undefined ? option.values : option.value;

  if (option.title !== undefined || isNew) {
    if (typeof option.title !== 'string' || !option.title.trim()) errors.push('A opção precisa de um "title"');
    else values.title = option.title.trim();
  }
  if (option.shape !== undefined) {
    if (!['square', 'circle'].includes(option.shape)) errors.push('O "shape" da opção deve ser "square" ou "circle"');
    else values.shape = option.shape;
  }
  if (option.type !== undefined) {
    if (!['text', 'color'].includes(option.type)) errors.push('O "type" da opção deve ser "text" ou "color"');
    else values.type = option.type;
  }
  const radius = parseRadius(option.radius);
  if (Number.isNaN(radius)) errors.push('O "radius" da opção deve ser um número (ex.: 4 ou "4px")');
  else if (radius !== undefined) values.radius = radius;

  if (list !== undefined || isNew) {
    const arr = Array.isArray(list) ? list : parseList(list);
    const clean = arr.map((v) => String(v).trim()).filter(Boolean);
    if (!clean.length) errors.push('A opção precisa de ao menos um valor em "values"');
    else if (clean.some((v) => v.includes(','))) errors.push('Os valores da opção não podem conter vírgula');
    else values.values = clean.join(',');
  }

  return { values, errors };
}

async function ensureCategoriesExist(categoryIds, transaction) {
  const unique = [...new Set(categoryIds)];
  if (!unique.length) return unique;
  const found = await Category.count({ where: { id: { [Op.in]: unique } }, transaction });
  if (found !== unique.length) throw AppError.badRequest('Uma ou mais categorias informadas não existem');
  return unique;
}

// ---------------------------------------------------------------------------
// Criação
// ---------------------------------------------------------------------------

async function create(data = {}) {
  const { values, errors } = validateProductFields(data, false);
  const optionsPayload = (Array.isArray(data.options) ? data.options : []).map((o) => normalizeOption(o || {}, true));
  optionsPayload.forEach((o) => errors.push(...o.errors));
  (Array.isArray(data.images) ? data.images : []).forEach((img, i) => {
    if (!img || typeof img.content !== 'string' || !img.content) errors.push(`A imagem ${i + 1} precisa de "content"`);
  });
  if (errors.length) throw AppError.badRequest('Dados do produto inválidos', errors);

  const savedFiles = [];
  try {
    const productId = await sequelize.transaction(async (transaction) => {
      const categoryIds = await ensureCategoriesExist(data.category_ids || [], transaction);
      const product = await Product.create(values, { transaction });

      if (categoryIds.length) {
        await ProductCategory.bulkCreate(
          categoryIds.map((category_id) => ({ product_id: product.id, category_id })),
          { transaction },
        );
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const img of data.images || []) {
        const path = imageStorage.isUrl(img.content)
          ? img.content
          // eslint-disable-next-line no-await-in-loop
          : await imageStorage.saveBase64(product.id, img);
        if (!imageStorage.isUrl(path)) savedFiles.push(path);
        // eslint-disable-next-line no-await-in-loop
        await ProductImage.create({ product_id: product.id, path, enabled: true }, { transaction });
      }

      if (optionsPayload.length) {
        await ProductOption.bulkCreate(
          optionsPayload.map((o) => ({ ...o.values, product_id: product.id })),
          { transaction },
        );
      }
      return product.id;
    });

    return findById(productId);
  } catch (err) {
    // Se a transação falhar, remove arquivos já gravados em disco
    await Promise.all(savedFiles.map(imageStorage.removeFile));
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Atualização
// ---------------------------------------------------------------------------

/** Aplica as alterações de imagens: criar, substituir, manter ou remover. */
async function syncImages(product, images, transaction, savedFiles, filesToRemove) {
  const existing = await ProductImage.findAll({ where: { product_id: product.id }, transaction });
  const byId = new Map(existing.map((img) => [img.id, img]));

  // eslint-disable-next-line no-restricted-syntax
  for (const img of images) {
    if (!img || typeof img !== 'object') throw AppError.badRequest('Imagem inválida');

    if (img.id === undefined) {
      // Nova imagem
      if (typeof img.content !== 'string' || !img.content) throw AppError.badRequest('Nova imagem precisa de "content"');
      const path = imageStorage.isUrl(img.content)
        ? img.content
        // eslint-disable-next-line no-await-in-loop
        : await imageStorage.saveBase64(product.id, img);
      if (!imageStorage.isUrl(path)) savedFiles.push(path);
      // eslint-disable-next-line no-await-in-loop
      await ProductImage.create({ product_id: product.id, path, enabled: true }, { transaction });
      // eslint-disable-next-line no-continue
      continue;
    }

    const current = byId.get(img.id);
    if (!current) throw AppError.badRequest(`A imagem ${img.id} não pertence a este produto`);

    if (img.deleted === true) {
      filesToRemove.push(current.path);
      // eslint-disable-next-line no-await-in-loop
      await current.destroy({ transaction });
    } else if (typeof img.content === 'string' && img.content && !imageStorage.isUrl(img.content)) {
      // Substitui o arquivo por um novo base64 (type opcional quando for data URL)
      // eslint-disable-next-line no-await-in-loop
      const path = await imageStorage.saveBase64(product.id, { type: img.type || 'image/png', content: img.content });
      savedFiles.push(path);
      filesToRemove.push(current.path);
      // eslint-disable-next-line no-await-in-loop
      await current.update({ path }, { transaction });
    }
    // content com URL: mantém a imagem como está
  }
}

/** Aplica as alterações de opções: criar, atualizar ou remover. */
async function syncOptions(product, options, transaction) {
  const existing = await ProductOption.findAll({ where: { product_id: product.id }, transaction });
  const byId = new Map(existing.map((o) => [o.id, o]));

  // eslint-disable-next-line no-restricted-syntax
  for (const option of options) {
    if (!option || typeof option !== 'object') throw AppError.badRequest('Opção inválida');

    if (option.id === undefined) {
      const { values, errors } = normalizeOption(option, true);
      if (errors.length) throw AppError.badRequest('Opção inválida', errors);
      // eslint-disable-next-line no-await-in-loop
      await ProductOption.create({ ...values, product_id: product.id }, { transaction });
      // eslint-disable-next-line no-continue
      continue;
    }

    const current = byId.get(option.id);
    if (!current) throw AppError.badRequest(`A opção ${option.id} não pertence a este produto`);

    if (option.deleted === true) {
      // eslint-disable-next-line no-await-in-loop
      await current.destroy({ transaction });
    } else {
      const { values, errors } = normalizeOption(option, false);
      if (errors.length) throw AppError.badRequest('Opção inválida', errors);
      // eslint-disable-next-line no-await-in-loop
      await current.update(values, { transaction });
    }
  }
}

async function update(id, data = {}) {
  const product = await Product.findByPk(id);
  if (!product) throw AppError.notFound('Produto não encontrado');

  const { values, errors } = validateProductFields(data, true);
  const hasRelations = ['category_ids', 'images', 'options'].some((k) => data[k] !== undefined);
  if (!errors.length && !Object.keys(values).length && !hasRelations) {
    errors.push('Informe ao menos um campo para atualizar');
  }
  if (errors.length) throw AppError.badRequest('Dados do produto inválidos', errors);

  const savedFiles = [];
  const filesToRemove = [];
  try {
    await sequelize.transaction(async (transaction) => {
      if (Object.keys(values).length) await product.update(values, { transaction });

      if (data.category_ids !== undefined) {
        const categoryIds = await ensureCategoriesExist(data.category_ids, transaction);
        await ProductCategory.destroy({ where: { product_id: product.id }, transaction });
        if (categoryIds.length) {
          await ProductCategory.bulkCreate(
            categoryIds.map((category_id) => ({ product_id: product.id, category_id })),
            { transaction },
          );
        }
      }

      if (data.images !== undefined) await syncImages(product, data.images, transaction, savedFiles, filesToRemove);
      if (data.options !== undefined) await syncOptions(product, data.options, transaction);
    });
  } catch (err) {
    await Promise.all(savedFiles.map(imageStorage.removeFile));
    throw err;
  }

  // Só remove arquivos antigos depois que a transação foi confirmada
  await Promise.all(filesToRemove.map(imageStorage.removeFile));
}

// ---------------------------------------------------------------------------
// Remoção
// ---------------------------------------------------------------------------

async function remove(id) {
  const product = await Product.findByPk(id, { include: [{ model: ProductImage, as: 'images' }] });
  if (!product) throw AppError.notFound('Produto não encontrado');

  const paths = product.images.map((img) => img.path);
  await sequelize.transaction(async (transaction) => {
    await ProductCategory.destroy({ where: { product_id: product.id }, transaction });
    await ProductImage.destroy({ where: { product_id: product.id }, transaction });
    await ProductOption.destroy({ where: { product_id: product.id }, transaction });
    await product.destroy({ transaction });
  });
  await Promise.all(paths.map(imageStorage.removeFile));
}

module.exports = {
  search, findById, create, update, remove,
};
