/**
 * Error de dominio HTTP con código de estado explícito.
 */
export class HttpError extends Error {
  statusCode: number;

  /** Construye un error controlado para respuestas API. */
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
