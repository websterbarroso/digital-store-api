/**
 * Controller de categorias.
 */
const categoryService = require('../services/categoryService');

async function search(req, res) {
  const result = await categoryService.search(req.query);
  res.status(200).json(result);
}

async function getById(req, res) {
  const category = await categoryService.findById(req.params.id);
  res.status(200).json(category);
}

async function create(req, res) {
  const category = await categoryService.create(req.body);
  res.status(201).json(category);
}

async function update(req, res) {
  await categoryService.update(req.params.id, req.body);
  res.status(204).end();
}

async function remove(req, res) {
  await categoryService.remove(req.params.id);
  res.status(204).end();
}

module.exports = { search, getById, create, update, remove };
