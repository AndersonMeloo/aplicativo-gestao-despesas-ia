// Erro com status HTTP. Lançado pelos services/validators e tratado no errorHandler.
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
