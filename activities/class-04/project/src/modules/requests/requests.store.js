// Persistence layer: every statement lives here, always parameterized.
// It knows rows and transactions; it does not know HTTP or Express.
// Domain outcomes (not found, invalid transition) are returned as values;
// database failures are thrown as translated errors (see database/pool.js).
import { query, clientQuery } from '../../database/pool.js';
import { withTransaction } from '../../database/transaction.js';
import { mapRequestRow, mapHistoryRow } from './request.mapper.js';

export const DEFAULT_PRIORITY = 'medium';

// Identifiers used in SQL are fixed strings in this file. The only values
// that ever travel as parameters are data, never column or table names.
const REQUEST_COLUMNS = 'id, title, description, priority, status, created_at, updated_at';

export async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.status !== undefined) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.priority !== undefined) {
    values.push(filters.priority);
    conditions.push(`priority = $${values.length}`);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const rows = await query(`SELECT ${REQUEST_COLUMNS} FROM requests${where} ORDER BY id`, values);
  return rows.map(mapRequestRow);
}

export async function findById(id) {
  const rows = await query(`SELECT ${REQUEST_COLUMNS} FROM requests WHERE id = $1`, [id]);
  return rows.length > 0 ? mapRequestRow(rows[0]) : null;
}

export async function create(fields) {
  return withTransaction(async (client) => {
    const rows = await clientQuery(
      client,
      `INSERT INTO requests (title, description, priority)
       VALUES ($1, $2, $3)
       RETURNING ${REQUEST_COLUMNS}`,
      [fields.title, fields.description ?? null, fields.priority ?? DEFAULT_PRIORITY]
    );
    const created = mapRequestRow(rows[0]);

    // The birth of a request is the first event of its history. Written in the
    // same transaction: a request never exists without its first row of history.
    await clientQuery(
      client,
      `INSERT INTO request_status_history (request_id, previous_status, new_status)
       VALUES ($1, NULL, 'open')`,
      [created.id]
    );

    return created;
  });
}

// patch: { title?, description?, priority?, status? }
// transition: { from, to } when (and only when) the status changes.
// Returns the updated row, or null if the request vanished meanwhile.
export async function update(id, patch, transition = null) {
  const assignments = [];
  const values = [id];

  if (patch.title !== undefined) {
    values.push(patch.title);
    assignments.push(`title = $${values.length}`);
  }
  if (patch.description !== undefined) {
    values.push(patch.description);
    assignments.push(`description = $${values.length}`);
  }
  if (patch.priority !== undefined) {
    values.push(patch.priority);
    assignments.push(`priority = $${values.length}`);
  }
  if (patch.status !== undefined) {
    values.push(patch.status);
    assignments.push(`status = $${values.length}`);
  }
  assignments.push('updated_at = NOW()');

  const sql = `UPDATE requests SET ${assignments.join(', ')} WHERE id = $1 RETURNING ${REQUEST_COLUMNS}`;

  if (!transition) {
    const rows = await query(sql, values);
    return rows.length > 0 ? mapRequestRow(rows[0]) : null;
  }

  // Status change: the new state of the request and the record of what
  // happened must land together or not at all.
  return withTransaction(async (client) => {
    const rows = await clientQuery(client, sql, values);
    if (rows.length === 0) return null;

    await clientQuery(
      client,
      `INSERT INTO request_status_history (request_id, previous_status, new_status)
       VALUES ($1, $2, $3)`,
      [id, transition.from, transition.to]
    );

    return mapRequestRow(rows[0]);
  });
}

export async function findHistory(requestId) {
  const rows = await query(
    `SELECT previous_status, new_status, changed_at
     FROM request_status_history
     WHERE request_id = $1
     ORDER BY changed_at ASC, id ASC`,
    [requestId]
  );
  return rows.map(mapHistoryRow);
}
