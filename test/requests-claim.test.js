// API tests for FEATURE-801 — the claim action through HTTP. One test per
// row of the behavior matrix in the ticket, plus the details that only
// show up at the boundary (error bodies, requestId, history).
//
// The rules themselves are proven WITHOUT HTTP in request-policy.test.js;
// here we prove the contract: status codes, bodies and side effects.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { createUser, createRequestAs } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

// The shared cast: an owner who opens requests and an agent who claims.
async function cast() {
  const owner = await createUser({ name: 'cowner' });
  const agent = await createUser({ name: 'cagent', role: 'agent' });
  const stranger = await createUser({ name: 'cstranger' });
  return {
    owner,
    agent,
    stranger,
    ownerToken: await loginAs(owner),
    agentToken: await loginAs(agent),
    strangerToken: await loginAs(stranger)
  };
}

test('claim requires authentication', async () => {
  const { ownerToken } = await cast();
  const target = await createRequestAs(ownerToken);

  const response = await request(app).post(`/requests/${target.id}/claim`);

  assert.equal(response.status, 401);
});

test('a requester cannot claim a request', async () => {
  const { ownerToken } = await cast();
  const target = await createRequestAs(ownerToken);

  const response = await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
  // The request is untouched: a refused claim changes nothing.
  assert.equal(response.body.assignedTo, undefined);
});

test('an agent claims an open request: 200, assignedTo from the token, in_progress', async () => {
  const { agent, agentToken, ownerToken } = await cast();
  const target = await createRequestAs(ownerToken);

  const response = await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.assignedTo, agent.id);
  assert.equal(response.body.status, 'in_progress');
  assert.equal(response.body.id, target.id);
  assert.ok(new Date(response.body.updatedAt) > new Date(target.updatedAt),
    'updatedAt must advance with the claim');

  // The change is durable, not just in the answer.
  const after = await request(app)
    .get(`/requests/${target.id}`)
    .set('Authorization', `Bearer ${agentToken}`);
  assert.equal(after.body.status, 'in_progress');
  assert.equal(after.body.assignedTo, agent.id);
});

test('claiming a nonexistent request answers 404', async () => {
  const { agentToken } = await cast();

  const response = await request(app)
    .post('/requests/999999999/claim')
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'REQUEST_NOT_FOUND');
  // Class 07 contract: the body carries requestId.
  assert.equal(typeof response.body.requestId, 'string');
});

test('a malformed id answers 400 before touching the database', async () => {
  const { agentToken } = await cast();

  const response = await request(app)
    .post('/requests/not-a-number/claim')
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_REQUEST_ID');
});

test('a second claim answers 409 REQUEST_ALREADY_ASSIGNED', async () => {
  const { agentToken, ownerToken } = await cast();
  const target = await createRequestAs(ownerToken);

  const first = await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);
  assert.equal(first.status, 200);

  const again = await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, 'REQUEST_ALREADY_ASSIGNED');
  // ...and the error body still carries requestId (class 07 contract).
  assert.equal(typeof again.body.requestId, 'string');
});

test('a second agent cannot take an already claimed request', async () => {
  const { ownerToken, agentToken } = await cast();
  const rival = await createUser({ name: 'crival', role: 'agent' });
  const rivalToken = await loginAs(rival);
  const target = await createRequestAs(ownerToken);

  await request(app).post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  const response = await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${rivalToken}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'REQUEST_ALREADY_ASSIGNED');
});

test('a terminal request cannot be claimed', async () => {
  const { agentToken, ownerToken } = await cast();
  const doomed = await createRequestAs(ownerToken);

  const cancel = await request(app)
    .patch(`/requests/${doomed.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'cancelled' });
  assert.equal(cancel.status, 200);

  const response = await request(app)
    .post(`/requests/${doomed.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'REQUEST_NOT_OPEN');
  assert.equal(response.body.assignedTo, undefined);
});

test('a request already in progress cannot be claimed again', async () => {
  const { agentToken, ownerToken } = await cast();
  const moving = await createRequestAs(ownerToken);

  await request(app).patch(`/requests/${moving.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'in_progress' });

  const response = await request(app)
    .post(`/requests/${moving.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 409);
});

test('assignedTo in the body is rejected as a server-controlled field', async () => {
  const { agent, agentToken, stranger, ownerToken } = await cast();
  const target = await createRequestAs(ownerToken);

  const response = await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ assignedTo: stranger.id });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'SERVER_CONTROLLED_FIELD');

  // Rejecting the attempt must NOT have claimed it for anybody — neither
  // for the attacker nor for the real agent.
  const after = await request(app)
    .get(`/requests/${target.id}`)
    .set('Authorization', `Bearer ${agentToken}`);
  assert.equal(after.body.assignedTo, null);
  assert.equal(after.body.status, 'open');
  assert.notEqual(after.body.assignedTo, stranger.id);
  assert.notEqual(after.body.assignedTo, agent.id);
});

test('the claim leaves a request_claimed event in the history', async () => {
  const { agentToken, ownerToken } = await cast();
  const target = await createRequestAs(ownerToken);

  await request(app)
    .post(`/requests/${target.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  const history = await request(app)
    .get(`/requests/${target.id}/history`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.equal(history.status, 200);
  const events = Array.isArray(history.body) ? history.body : [];
  const claimEvent = events.find((event) => event.type === 'request_claimed');

  assert.ok(claimEvent, 'the history must contain a request_claimed event');
  assert.equal(claimEvent.fromStatus, 'open');
  assert.equal(claimEvent.toStatus, 'in_progress');
  // changed_by stays internal: the contract of the history does not
  // expose the actor.
  assert.equal(claimEvent.changedBy, undefined);
});
