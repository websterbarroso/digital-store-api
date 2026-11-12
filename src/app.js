/**
 * Configuração da aplicação Express (sem subir o servidor),
 * o que permite reutilizá-la nos testes com supertest.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const qs = require('qs');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const swaggerDocument = require('./docs/swagger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Mantém "option[45]=GG,PP" como objeto { option: { 45: 'GG,PP' } } (sem virar array)
app.set('query parser', (str) => qs.parse(str, { parseArrays: false }));

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '20mb' })); // imagens chegam em base64

// Arquivos de imagem dos produtos
app.use('/media', express.static(path.resolve(process.env.MEDIA_DIR || path.join(__dirname, '..', 'public', 'media'))));

// Documentação Swagger
app.get('/docs.json', (req, res) => res.json(swaggerDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customSiteTitle: 'Digital Store API' }));

app.get('/', (req, res) => res.json({ name: 'Digital Store API', version: '1.0.0', docs: '/docs' }));

app.use('/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
