/**
 * Salva imagens recebidas em base64 na pasta public/media e
 * converte o caminho salvo em URL pública.
 */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const MIME_EXTENSIONS = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function mediaDir() {
  return path.resolve(process.env.MEDIA_DIR || path.join(__dirname, '..', '..', 'public', 'media'));
}

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/**
 * Salva a imagem e retorna o caminho relativo (ex.: "product-1/abc.png").
 * Aceita base64 puro ou "data URL" (data:image/png;base64,...).
 */
async function saveBase64(productId, { type, content }) {
  if (typeof content !== 'string' || !content.trim()) {
    throw AppError.badRequest('Imagem sem conteúdo');
  }

  let mime = type;
  let data = content.trim();
  const dataUrl = data.match(/^data:([\w/+.-]+);base64,(.*)$/s);
  if (dataUrl) {
    [, mime, data] = dataUrl;
  }

  const ext = MIME_EXTENSIONS[String(mime).toLowerCase()];
  if (!ext) throw AppError.badRequest(`Tipo de imagem não suportado: ${mime}`);
  if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) throw AppError.badRequest('Conteúdo da imagem não é um base64 válido');

  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length) throw AppError.badRequest('Conteúdo da imagem não é um base64 válido');

  const relative = path.posix.join(`product-${productId}`, `${crypto.randomUUID()}.${ext}`);
  const absolute = path.join(mediaDir(), relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, buffer);
  return relative;
}

/** Remove o arquivo de uma imagem (ignora URLs externas e arquivos inexistentes). */
async function removeFile(relativePath) {
  if (!relativePath || isUrl(relativePath) || relativePath.startsWith('seed/')) return;
  try {
    await fs.unlink(path.join(mediaDir(), relativePath));
  } catch (err) {
    // arquivo já removido: nada a fazer
  }
}

/** Monta a URL pública de uma imagem. */
function toUrl(relativePath) {
  if (isUrl(relativePath)) return relativePath;
  const base = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
  return `${base}/media/${relativePath}`;
}

module.exports = { saveBase64, removeFile, toUrl, isUrl, MIME_EXTENSIONS };
