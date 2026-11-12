const { Router } = require('express');
const controller = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const validateId = require('../middleware/validateId');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// Rotas públicas
router.post('/token', asyncHandler(controller.token)); // login (gera JWT)
router.post('/', asyncHandler(controller.create)); // cadastro
router.get('/:id', validateId, asyncHandler(controller.getById));

// Rotas protegidas por JWT
router.put('/:id', authenticate, validateId, asyncHandler(controller.update));
router.delete('/:id', authenticate, validateId, asyncHandler(controller.remove));

module.exports = router;
