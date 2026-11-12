/**
 * Controller de produtos.
 */
const productService = require('../services/productService');

async function search(req, res) {
  const result = await productService.search(req.query);
  res.status(200).json(result);
}

async function getById(req, res) {
  const product = await productService.findById(req.params.id);
  res.status(200).json(product);
}

async function create(req, res) {
  const product = await productService.create(req.body);
  res.status(201).json(product);
}

async function update(req, res) {
  await productService.update(req.params.id, req.body);
  res.status(204).end();
}

async function remove(req, res) {
  await productService.remove(req.params.id);
  res.status(204).end();
}

module.exports = { search, getById, create, update, remove };
