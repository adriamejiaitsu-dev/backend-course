// In-memory storage. There is no database: the data resets on every restart.
// This file administers the array and the identity of the requests. It does not
// know what an HTTP status code is.

import { checkUpdate } from './request-status.js';

// Closed list of values the priority field can take. When it does not arrive,
// the server applies the default.
export const PRIORITIES = Object.freeze(['low', 'medium', 'high']);
export const DEFAULT_PRIORITY = 'medium';

const requests = [
  {
    id: 1,
    title: 'Projector does not turn on',
    description: 'The projector in room 204 shows no image during class.',
    status: 'open',
    priority: 'high',
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z'
  },
  {
    id: 2,
    title: 'Broken chair in the lab',
    description: 'One chair in the computer lab has a loose back rest.',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2026-10-05T10:30:00.000Z',
    updatedAt: '2026-10-05T11:05:00.000Z'
  },
  {
    id: 3,
    title: 'Wi-Fi drops in the library',
    description: 'The connection drops every few minutes on the second floor.',
    status: 'open',
    priority: 'low',
    createdAt: '2026-10-05T12:15:00.000Z',
    updatedAt: '2026-10-05T12:15:00.000Z'
  }
];

// Identifier for the next request that gets created. It only moves forward:
// it does not repeat ids while the process lives, and it restarts on every reboot.
let nextId = 4;

// Returns every request, narrowed by the filters the collection supports.
// Both filters are optional and combine: an empty result is still a 200.
export function listRequests(filters = {}) {
  return requests.filter((request) => {
    if (filters.status !== undefined && request.status !== filters.status) {
      return false;
    }
    if (filters.priority !== undefined && request.priority !== filters.priority) {
      return false;
    }
    return true;
  });
}

export function getRequestById(id) {
  return requests.find((request) => request.id === id);
}

// Creation contract: the client brings the problem, the server owns the identity.
// id, status, createdAt and updatedAt are decided here; a "status" or an "id"
// sent by the client never reaches this function (routes drop them).
export function createRequest(fields) {
  const now = new Date().toISOString();

  const newRequest = {
    id: nextId,
    title: fields.title,
    description: fields.description,
    status: 'open',
    priority: fields.priority ?? DEFAULT_PRIORITY,
    createdAt: now,
    updatedAt: now
  };

  nextId = nextId + 1;
  requests.push(newRequest);

  return newRequest;
}

// Partial update. The store applies the change only after the lifecycle rule
// accepts it: a terminal request does not move, and a status change must exist
// in the transition map. It answers with a domain outcome, never with an HTTP code.
export function updateRequest(id, patch) {
  const request = getRequestById(id);

  if (!request) {
    return { ok: false, code: 'REQUEST_NOT_FOUND', message: `Request ${id} not found` };
  }

  const decision = checkUpdate(request.status, patch.status);

  if (!decision.ok) {
    return { ok: false, code: decision.code, message: decision.message };
  }

  if (patch.title !== undefined) {
    request.title = patch.title;
  }
  if (patch.description !== undefined) {
    request.description = patch.description;
  }
  if (patch.priority !== undefined) {
    request.priority = patch.priority;
  }
  if (patch.status !== undefined) {
    request.status = patch.status;
  }

  request.updatedAt = new Date().toISOString();

  return { ok: true, request };
}
