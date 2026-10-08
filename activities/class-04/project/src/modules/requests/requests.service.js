// Domain services: existence, transitions, invariants. The service decides
// WHAT happens; the store decides HOW the rows change; the routes decide the
// HTTP status. Domain outcomes come back as { ok, code, message } values.
import * as store from './requests.store.js';
import { checkUpdate } from './request-status.js';

export const PRIORITIES = Object.freeze(['low', 'medium', 'high']);

export function isKnownPriority(value) {
  return PRIORITIES.includes(value);
}

export async function list(filters = {}) {
  return store.findAll(filters);
}

export async function getById(id) {
  return store.findById(id);
}

// Already validated by the route: title present and non-empty, priority known.
export async function create(fields) {
  return store.create(fields);
}

// Returns { ok: true, request } or { ok: false, code, message }.
// Database errors are not outcomes: they are thrown and handled by the
// error middleware (503 / 400 / 500, never a raw PostgreSQL message).
export async function update(id, patch) {
  const current = await store.findById(id);
  if (!current) {
    return {
      ok: false,
      code: 'REQUEST_NOT_FOUND',
      message: `Request with id ${id} does not exist`
    };
  }

  let transition = null;
  if (patch.status !== undefined) {
    const decision = checkUpdate(current.status, patch.status);
    if (!decision.ok) {
      return { ok: false, code: decision.code, message: decision.message };
    }
    transition = { from: current.status, to: patch.status };
  } else {
    const stillModifiable = checkUpdate(current.status, undefined);
    if (!stillModifiable.ok) {
      return { ok: false, code: stillModifiable.code, message: stillModifiable.message };
    }
  }

  const updated = await store.update(id, patch, transition);
  if (!updated) {
    return {
      ok: false,
      code: 'REQUEST_NOT_FOUND',
      message: `Request with id ${id} does not exist`
    };
  }
  return { ok: true, request: updated };
}

// null when the request does not exist (the route answers 404).
export async function getHistory(id) {
  const request = await store.findById(id);
  if (!request) return null;
  return store.findHistory(id);
}
