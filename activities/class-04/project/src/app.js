// Application setup: middlewares and route mounting. It does not open any port.
import express from 'express';
import requestsRoutes from './modules/requests/requests.routes.js';

const app = express();

// Parses incoming JSON bodies into req.body.
app.use(express.json());

// Every route inside the router is served under /requests.
app.use('/requests', requestsRoutes);

// Any other path is not part of the API. Same error shape as every other failure.
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// A body that does not parse never reaches a route, so the contract answers for it:
// 400 with the standard error object instead of an HTML page.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'EMPTY_PATCH_BODY',
        message: 'Request body is not valid JSON'
      }
    });
  }

  next(err);
});

// Every database failure lands here. Errors thrown by the store were already
// translated in database/pool.js into { status, code, message } with safe text;
// anything else is a real bug and must not leak its internals.
app.use((err, req, res, next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = err.code && typeof err.code === 'string' && /^[A-Z][A-Z_]*$/.test(err.code)
    ? err.code
    : 'INTERNAL_ERROR';
  const message = code === 'INTERNAL_ERROR'
    ? 'Something went wrong'
    : (err.message ?? 'Something went wrong');

  // Server-side only: never returned to the client. SQLSTATE codes and rows
  // belong to the log, not to the response body.
  console.error(`[db] ${req.method} ${req.originalUrl} -> ${status} ${code} (pg: ${err.pgCode ?? 'n/a'})`);

  res.status(status).json({ error: { code, message } });
});

export default app;