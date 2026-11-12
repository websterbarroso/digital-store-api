// Ambiente de testes: SQLite em memória e imagens em pasta temporária
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.APP_URL = 'http://localhost:3000';
process.env.MEDIA_DIR = path.join(os.tmpdir(), `digital-store-media-test-${process.pid}`);
