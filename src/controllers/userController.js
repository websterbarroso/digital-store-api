/**
 * Controller de usuários: recebe a requisição HTTP, chama o service
 * e devolve a resposta com o status code adequado.
 */
const userService = require('../services/userService');

async function getById(req, res) {
  const user = await userService.findById(req.params.id);
  res.status(200).json(user);
}

async function create(req, res) {
  const user = await userService.create(req.body);
  res.status(201).json(user);
}

async function update(req, res) {
  await userService.update(req.params.id, req.body);
  res.status(204).end();
}

async function remove(req, res) {
  await userService.remove(req.params.id);
  res.status(204).end();
}

async function token(req, res) {
  const result = await userService.generateToken(req.body);
  res.status(200).json(result);
}

module.exports = { getById, create, update, remove, token };
