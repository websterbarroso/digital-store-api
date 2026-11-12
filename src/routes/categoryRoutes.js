const { Router } = require('express');
const controller = require('../controllers/categoryController');
const authenticate = require('../middleware/auth');
const validateId = require('../middleware/validateId');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// Rotas públicas ("/search" precisa vir antes de "/:id")
router.get('/search', asyncHandler(controller.search));
router.get('/:id', validateId, asyncHandler(controller.getById));

// Rotas protegidas por JWT
router.post('/', authenticate, asyncHandler(controller.create));
router.put('/:id', authenticate, validateId, asyncHandler(controller.update));
router.delete('/:id', authenticate, validateId, asyncHandler(controller.remove));

module.exports = router;
