// Single connection pool for the whole process. Creating a connection per
// request is slow and PostgreSQL limits how many may exist at once.
// Every query goes through this module so database failures always leave the
// same shape behind: an error with an API code, never a raw pg message
// (those can contain hostnames, SQL fragments or credentials hints).
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    })
  : null;

// SQLSTATE classes: 08xxx connection exceptions, 53 resource limit,
// 57 operator intervention (server shutdown / reject).
const UNAVAILABLE_SQLSTATES = new Set([
  '08000', '08001', '08003', '08006', '08007',
  '53300', '57P01', '57P02', '57P03'
]);

const UNAVAILABLE_ERRNOS = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH',
  'EAI_AGAIN', 'ECONNRESET', 'EPIPE'
]);

export function isUnavailable(error) {
  if (!error) return false;
  if (UNAVAILABLE_SQLSTATES.has(error.code)) return true;
  // Operating-system failures: node-postgres sets err.code to the errno name
  // (e.g. ECONNREFUSED) and err.errno to a negative number.
  if (UNAVAILABLE_ERRNOS.has(error.code)) return true;
  if (typeof error.errno === 'number' && error.errno < 0) return true;
  return /Connection refused|connect ECONNREFUSED|timeout expired|could not connect|getaddrinfo|other end closed|Connection terminated/i.test(
    String(error.message ?? '')
  );
}

export function databaseError(cause) {
  const error = new Error('The database is not available right now');
  error.code = 'DATABASE_UNAVAILABLE';
  error.status = 503;
  if (cause) error.cause = cause;
  return error;
}

// Public translation of PostgreSQL errors into API errors (see error-map.md).
// Raw pg messages are never exposed: only fixed, safe text goes to the client.
function apiError(code, status, message, cause) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.pgCode = cause?.code;
  error.cause = cause;
  return error;
}

const PG_SQLSTATE_MAP = {
  '22001': ['TITLE_TOO_LONG', 400, 'Value is too long for its column'],
  '23502': ['CONSTRAINT_VIOLATION', 400, 'A required value is missing'],
  '23514': ['CONSTRAINT_VIOLATION', 400, 'A value does not satisfy a database constraint'],
  '23505': ['CONSTRAINT_VIOLATION', 400, 'That value is already taken']
};

export function translate(error) {
  if (!error) return error;
  // One of ours already (always carries a numeric HTTP status): pass it through.
  if (Number.isInteger(error.status) && error.code && /^[A-Z][A-Z_]*$/.test(error.code)) {
    return error;
  }
  if (isUnavailable(error)) return databaseError(error);
  if (error.code === '22P02') {
    // Safety net: a non numeric identifier reached PostgreSQL. The HTTP layer
    // converts this to the documented 404 before ever querying (class 03 contract).
    return apiError('INVALID_REQUEST_ID', 400, 'The identifier is not a number', error);
  }
  const mapped = PG_SQLSTATE_MAP[error.code];
  if (mapped) return apiError(mapped[0], mapped[1], mapped[2], error);
  return error;
}

// Query on the shared pool. Returns rows (not the pg Result object).
export async function query(text, params) {
  if (!pool) throw databaseError();
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    throw translate(error);
  }
}

// Query on a transaction client. Same translation, same contract.
export async function clientQuery(client, text, params) {
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    throw translate(error);
  }
}
