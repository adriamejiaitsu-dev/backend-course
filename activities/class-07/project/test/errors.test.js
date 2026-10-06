// Error contract tests — INCOMPLETE, on purpose.
//
// These are the regression tests you will write during the workshop. Each
// stub states the QUESTION the test must answer; you turn it into a real
// Prepare -> Act -> Check test as you resolve INC-701 and INC-702.
//
// Remove { todo: true } as you implement each one. Use the existing
// helpers (test/helpers/) — unique data per run, cleanup of exactly what
// was created — and look at test/requests.test.js for the house style.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { createUser, createRequestAs } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';
import { pool } from '../src/database/pool.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

// ------------------------------------------------- INC-701 regression

test('an alphabetic id answers 400 INVALID_REQUEST_ID, not 500', async () => {
  // Prepare: a registered user with a token.
  const owner = await createUser({ name: 'badid' });
  const token = await loginAs(owner);

  // Act:     GET /requests/not-a-number
  const response = await request(app)
    .get('/requests/not-a-number')
    .set('Authorization', `Bearer ${token}`);

  // Check:   status 400 AND body.error.code === 'INVALID_REQUEST_ID'
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_REQUEST_ID');
});

test('decimal, zero and negative ids are rejected the same way', async () => {
  const owner = await createUser({ name: 'floor' });
  const token = await loginAs(owner);

  // parseInt('12abc') accepts 12 — a regex over the FULL value must reject
  // it, because the client sent "12abc", not 12.
  for (const bad of ['1.5', '0', '-3', '12abc']) {
    const response = await request(app)
      .get(`/requests/${bad}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(response.status, 400, `id "${bad}"`);
    assert.equal(response.body.error.code, 'INVALID_REQUEST_ID', `id "${bad}"`);
  }
});

test('a well-formed id that matches nothing still answers 404', async () => {
  const owner = await createUser({ name: 'ghost' });
  const token = await loginAs(owner);

  // Act: GET /requests/999999999 -> 404 REQUEST_NOT_FOUND.
  const response = await request(app)
    .get('/requests/999999999')
    .set('Authorization', `Bearer ${token}`);

  // Check: invalid format and missing resource are DIFFERENT answers.
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'REQUEST_NOT_FOUND');
});

// ------------------------------------------------- INC-702 regression

test('an invalid priority answers 400 INVALID_PRIORITY before touching SQL', async () => {
  // Prepare: an owner with a request, an agent with a token.
  const owner = await createUser({ name: 'prio-owner' });
  const agent = await createUser({ name: 'prio-agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  // Act:     PATCH /requests/:id { priority: 'critical' } as the agent.
  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'critical' });

  // Check:   status 400 AND body.error.code === 'INVALID_PRIORITY'.
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_PRIORITY');
});

test('a valid priority change still works after the fix', async () => {
  const owner = await createUser({ name: 'prio-good-owner' });
  const agent = await createUser({ name: 'prio-good-agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken, { priority: 'low' });

  // Act: PATCH { priority: 'high' } as agent -> 200 with priority 'high'.
  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'high' });

  assert.equal(response.status, 200);
  assert.equal(response.body.priority, 'high');
});

// ------------------------------------------------- central error handler

test('an unexpected error answers a generic 500 without internal details', async (t) => {
  const owner = await createUser({ name: 'boom' });
  const token = await loginAs(owner);

  // Sabotage pool.query for the duration of the request (the same
  // technique the validator uses), then restore it in a finally.
  const realQuery = pool.query.bind(pool);
  pool.query = async () => { throw new Error('secret internal detail: token bucket broke'); };
  try {
    const response = await request(app)
      .get('/requests')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 500);
    assert.equal(response.body.error.code, 'INTERNAL_ERROR');
    const raw = response.text;
    assert.ok(!raw.includes('secret internal detail'));
    assert.ok(!raw.includes('at '));
    assert.ok(!raw.includes('stack'));
  } finally {
    pool.query = realQuery; // leave the pool exactly as found
  }
});

test('every error body shares the same shape: error.code, error.message, requestId', async () => {
  const owner = await createUser({ name: 'shape' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/not-a-number')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(typeof response.body.error.code, 'string');
  assert.equal(typeof response.body.error.message, 'string');
  assert.equal(typeof response.body.requestId, 'string');
});
