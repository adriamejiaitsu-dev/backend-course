// Status vocabulary and lifecycle rules of a request.
// This file declares the domain rules: it knows nothing about the array and nothing about Express.

// Closed list of values the status field can take.
export const STATUSES = Object.freeze(['open', 'in_progress', 'resolved', 'closed', 'cancelled']);

// Statuses that do not admit any outgoing transition.
export const TERMINAL_STATUSES = Object.freeze(['closed', 'cancelled']);

// The map IS the lifecycle: an arrow that is not declared here is forbidden.
const TRANSITIONS = Object.freeze({
  open: Object.freeze(['in_progress', 'cancelled']),
  in_progress: Object.freeze(['resolved', 'cancelled']),
  resolved: Object.freeze(['in_progress', 'closed']),
  closed: Object.freeze([]),
  cancelled: Object.freeze([])
});

// Shape validation: decidable without any state.
export function isKnownStatus(value) {
  return STATUSES.includes(value);
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function canMove(fromStatus, toStatus) {
  const allowed = TRANSITIONS[fromStatus];
  return allowed !== undefined && allowed.includes(toStatus);
}

// Rule validation: depends on the current state of the request.
// nextStatus may be undefined when the caller only wants to know whether the
// request can be modified at all (a terminal request cannot).
export function checkUpdate(currentStatus, nextStatus) {
  if (isTerminal(currentStatus)) {
    return {
      ok: false,
      code: 'REQUEST_IN_TERMINAL_STATUS',
      message: `Request in terminal status "${currentStatus}" cannot be modified`
    };
  }

  if (nextStatus !== undefined && !canMove(currentStatus, nextStatus)) {
    return {
      ok: false,
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot move a request from "${currentStatus}" to "${nextStatus}"`
    };
  }

  return { ok: true };
}
