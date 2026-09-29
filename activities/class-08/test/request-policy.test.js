// Policy tests — the payoff of the whole class: once canClaimRequest
// depends on nothing, its entire behavior matrix runs here with plain
// objects. No HTTP. No PostgreSQL. No server.
//
// Every row of the FEATURE-801 matrix that belongs to the POLICY is one
// assertion below. The rows that belong to the HTTP contract (200/401/
// 403/404/409 and the error body) live in requests-claim.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canClaimRequest } from '../src/modules/requests/request.policy.js';

// Plain data. If these tests ever need a database, the rule left the
// policy file.
const agent = { userId: 'agent-1', role: 'agent' };
const otherAgent = { userId: 'agent-2', role: 'agent' };
const requester = { userId: 'requester-1', role: 'requester' };

const openUnassigned = {
  id: 1,
  status: 'open',
  createdBy: requester.userId,
  assignedTo: null
};

test('an agent can claim an open, unassigned request', () => {
  assert.deepEqual(canClaimRequest({ actor: agent, request: openUnassigned }),
    { allowed: true });
});

test('a requester cannot claim, even an open request', () => {
  assert.deepEqual(canClaimRequest({ actor: requester, request: openUnassigned }),
    { allowed: false, reason: 'NOT_AGENT' });
});

test('an already assigned request cannot be claimed again', () => {
  // Even by the SAME agent: the rule answers "is it free?", not "is it
  // mine?". The service decides the 409, not who holds it.
  const assigned = { ...openUnassigned, assignedTo: agent.userId };

  assert.deepEqual(canClaimRequest({ actor: agent, request: assigned }),
    { allowed: false, reason: 'ALREADY_ASSIGNED' });
  assert.deepEqual(canClaimRequest({ actor: otherAgent, request: assigned }),
    { allowed: false, reason: 'ALREADY_ASSIGNED' });
});

test('a request that is not open cannot be claimed', () => {
  for (const status of ['in_progress', 'resolved', 'closed', 'cancelled']) {
    assert.deepEqual(
      canClaimRequest({ actor: agent, request: { ...openUnassigned, status } }),
      { allowed: false, reason: 'NOT_OPEN' },
      `a ${status} request must not be claimable`
    );
  }
});

test('the role rule wins over the state rules', () => {
  // requester + assigned request -> the reported reason is NOT_AGENT.
  // (The caller answers 403 before any state conflict.)
  const assigned = { ...openUnassigned, assignedTo: agent.userId };

  assert.deepEqual(canClaimRequest({ actor: requester, request: assigned }),
    { allowed: false, reason: 'NOT_AGENT' });

  const closed = { ...openUnassigned, status: 'closed' };
  assert.deepEqual(canClaimRequest({ actor: requester, request: closed }),
    { allowed: false, reason: 'NOT_AGENT' });
});

test('a missing assignedTo is read as unassigned', () => {
  // The column exists since migration 005, but the rule should not
  // depend on the field being present to mean "nobody yet".
  const { assignedTo, ...withoutField } = openUnassigned;

  assert.equal(canClaimRequest({ actor: agent, request: withoutField }).allowed, true);
  assert.equal(canClaimRequest({ actor: agent, request: { ...openUnassigned, assignedTo: undefined } }).allowed, true);
});

test('the policy is a pure function of its arguments', () => {
  const request = { ...openUnassigned };

  const first = canClaimRequest({ actor: agent, request });
  const second = canClaimRequest({ actor: agent, request });

  // Same answer, and the input was not mutated along the way.
  assert.deepEqual(first, second);
  assert.equal(request.status, 'open');
  assert.equal(request.assignedTo, null);
});
