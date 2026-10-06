// Application setup: middlewares and module mounting. It does not open any
// port.
//
// OPS-703 · The order IS the design, each position has its reason:
//   1. CORS first: preflights must be answered before anything else runs.
//   2. requestId: EVERY request gets an identifier before anything logs.
//   3. requestLogger BEFORE express.json() so requests with a BROKEN body
//      (400 INVALID_JSON) are also logged.
//   4. express.json() parses incoming JSON bodies into req.body.
//   5. /health and /ready are public: they live before `authenticate`.
//   6. /auth mixes public routes (register, login) and one protected route
//      (/me), so the module applies `authenticate` internally where needed.
//   7. Every requests route needs a trusted actor: authenticate runs first
//      and builds req.auth, or answers 401 and the router never runs.
//   8. notFound after ALL routes: it runs only when nothing matched, and
//      generates the error that the error handler translates.
//   9. errorHandler LAST: an error middleware only sees what happened
//      BEFORE it in this file.
import express from 'express';
import { corsPolicy } from './middleware/cors.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { authenticate } from './middleware/authenticate.js';
import { healthRoutes } from './routes/health.routes.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import requestsRoutes from './modules/requests/requests.routes.js';

const app = express();

app.use(corsPolicy);
app.use(requestId);
app.use(requestLogger);

app.use(express.json());

app.use(healthRoutes);

app.use('/auth', authRoutes);

app.use('/requests', authenticate, requestsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;