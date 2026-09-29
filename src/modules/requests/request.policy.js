// Authorization policy for the requests module. Pure functions over an
// actor and (when relevant) a request representation: no SQL, no HTTP.
// The middleware establishes WHO the actor is; these functions decide
// WHAT the actor may do; the service keeps the use-case rules.
//
// Workshop access matrix (fixed baseline — the validator relies on it):
//   list all requests ......... agent
//   list own requests ......... requester (scoped in SQL, not in JS)
//   view / history ............ agent: any · requester: own only
//   create .................... requester
//   edit title/description .... requester, own request, while open
//   change priority ........... agent
//   change status ............. agent (state machine still applies)
//   claim ..................... agent, request open and unassigned (FEATURE-801)

export function canListAllRequests(actor) {
  return actor.role === 'agent';
}

export function canViewRequest(actor, request) {
  if (actor.role === 'agent') return true;
  return request.createdBy === actor.userId;
}

export function canViewHistory(actor, request) {
  return canViewRequest(actor, request);
}

export function canCreateRequest(actor) {
  return actor.role === 'requester';
}

export function canEditContent(actor, request) {
  return actor.role === 'requester'
    && request.createdBy === actor.userId
    && request.status === 'open';
}

export function canChangePriority(actor) {
  return actor.role === 'agent';
}

export function canChangeStatus(actor) {
  return actor.role === 'agent';
}

// Claim policy (FEATURE-801).
//
// Three denial reasons, three different HTTP answers — which is exactly
// why this returns a REASON and not a boolean. The policy names what is
// wrong; the service translates each reason into an AppError.
//
// The ORDER is a decision, not an accident: the role rule runs first, so
// a requester asking for an already-assigned request is told 403 (you may
// not claim at all) instead of 409 (it is taken). Answering the identity
// question before the state question never leaks state to someone who was
// never allowed to act.
export function canClaimRequest({ actor, request }) {
  if (actor.role !== 'agent') {
    return { allowed: false, reason: 'NOT_AGENT' };
  }
  // NULL means "nobody has claimed it yet" — migration 005 is explicit
  // about that. An absent field would read as unassigned too, so both
  // shapes are treated as free.
  if (request.assignedTo !== null && request.assignedTo !== undefined) {
    return { allowed: false, reason: 'ALREADY_ASSIGNED' };
  }
  if (request.status !== 'open') {
    return { allowed: false, reason: 'NOT_OPEN' };
  }
  return { allowed: true };
}
