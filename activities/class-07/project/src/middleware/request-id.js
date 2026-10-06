// OPS-703 · Request ID middleware.
//
// Every request gets ONE identifier that travels with it — into the logs,
// into every error body, and back to the client in the X-Request-Id
// response header. It identifies the REQUEST, not the user: a JWT is a
// secret AND identifies the user, so it can never stand in for this id.
import { randomUUID } from 'node:crypto';

// A client-sent X-Request-Id is accepted ONLY when it is boring and
// limited. An unlimited header echoed into logs is an injection vector
// (fake log lines, oversized payloads); this pattern rejects line breaks,
// spaces and anything longer than 64 characters.
const HEADER_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && HEADER_PATTERN.test(incoming)
    ? incoming
    : `req_${randomUUID()}`;

  req.requestId = id;
  res.set('X-Request-Id', id);
  next();
}