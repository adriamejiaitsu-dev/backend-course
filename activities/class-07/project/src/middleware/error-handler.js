// OPS-703 · Central error middleware.
//
// ONE place where an error becomes an HTTP response, replacing the
// try/catch repeated inside every route. Express 5 forwards thrown errors
// and rejected promises here on its own. Like the file it replaces
// (src/http/respond-error.js, deleted during OPS-703), it holds the only
// category->status table in the codebase.
//
// Express recognizes an error middleware because it declares EXACTLY four
// parameters — never remove one, even if unused.
import { AppError } from '../app-error.js';
import { logger } from '../logging/logger.js';

const CATEGORY_STATUS = {
  contract: 400,
  auth: 401,
  forbidden: 403,
  resource: 404,
  domain: 409
};

// Errors whose cause is the database being unreachable -> 503.
const INFRASTRUCTURE_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', '57P03'];

export function errorHandler(error, req, res, next) {
  // If headers were already sent, Express's contract says the error must
  // be delegated: we can no longer shape the response.
  if (res.headersSent) return next(error);

  let status = 500;
  let body = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' };

  if (error instanceof AppError) {
    status = CATEGORY_STATUS[error.category] ?? 500;
    body = { code: error.code, message: error.message };
  } else if (error.type === 'entity.parse.failed') {
    // A body that is not valid JSON: the client broke the request.
    status = 400;
    body = { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' };
  } else if (INFRASTRUCTURE_CODES.includes(error.code) || /Connection terminated/i.test(error.message ?? '')) {
    status = 503;
    body = { code: 'DATABASE_UNAVAILABLE', message: 'The service cannot access its data store.' };
    // Log enough to diagnose — never the connection string.
    logger.error('database_unavailable', { requestId: req.requestId, code: error.code ?? error.message });
  } else {
    // Unexpected: generic 500 outside, real detail only in the log.
    logger.error('unexpected_error', {
      requestId: req.requestId,
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  res.locals.errorCode = body.code;
  res.status(status).json({ error: body, requestId: req.requestId });
}