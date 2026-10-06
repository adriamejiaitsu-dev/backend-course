// OPS-703 · Not-found middleware.
//
// When NO route matched, answer with the same JSON error contract as
// everything else instead of Express's default HTML page. It forwards a
// typed error so the central error handler produces the response.
//
// It lives AFTER all routes (so it runs only when nothing matched) and
// BEFORE the error handler (it GENERATES the error the handler translates).
// Echoing the requested path back into the message is a bad idea: it
// reflects attacker-controlled text and leaks nothing useful.
import { AppError } from '../app-error.js';

export function notFound(req, res, next) {
  next(new AppError('resource', 'ROUTE_NOT_FOUND', 'The requested route does not exist.'));
}