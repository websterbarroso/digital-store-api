/**
 * Envolve um controller assíncrono para que erros (rejeições de Promise)
 * sejam encaminhados ao middleware de tratamento de erros do Express.
 */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
