// Runs a unit of work inside a single PostgreSQL transaction.
// BEGIN and COMMIT are on the same client as the statements: a transaction is
// a private conversation with the database. Any failure rolls everything back
// (including the partial write that caused it) and the client always returns
// to the pool in the finally block.
import { pool, databaseError, translate } from './pool.js';

export async function withTransaction(unitOfWork) {
  if (!pool) throw databaseError();

  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    throw translate(error);
  }

  try {
    await client.query('BEGIN');
  } catch (error) {
    client.release();
    throw translate(error);
  }

  try {
    const result = await unitOfWork(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The connection may already be broken; the pool discards it anyway.
    }
    throw translate(error);
  } finally {
    client.release();
  }
}
