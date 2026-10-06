// OPS-703 · Request logger middleware.
//
// One structured JSON line per finished request, whatever its outcome.
// The logger module already formats and writes lines — this middleware
// only decides WHEN to log (on the response 'finish' event, the only
// moment the final status is known) and WHICH fields to include (a fixed
// ALLOWLIST). Logging never delays the request: next() runs immediately.
import { logger } from '../logging/logger.js';

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    // Allowlist on purpose: the request object, the headers and the body
    // never reach a log line. The Authorization header in particular is a
    // live credential and must never be written anywhere.
    const fields = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl ?? req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs)
    };
    if (req.auth?.userId) fields.userId = req.auth.userId;
    if (res.locals?.errorCode) fields.errorCode = res.locals.errorCode;

    if (res.statusCode >= 500) logger.error('request_failed', fields);
    else logger.info('request_completed', fields);
  });

  next();
}