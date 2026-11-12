/**
 * Erro de aplicação com status HTTP. Lançado pelos services e tratado
 * pelo middleware de erros, que converte em uma resposta JSON.
 */
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message = 'Dados da requisição inválidos', details) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'Token de autorização ausente ou inválido') {
    return new AppError(401, message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new AppError(404, message);
  }
}

module.exports = AppError;
