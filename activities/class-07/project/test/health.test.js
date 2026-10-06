// Health and readiness tests.
//
// The interesting case is "/ready when the database is down" WITHOUT
// touching real credentials: createHealthRouter accepts an injectable
// checkDatabase function — hand it one that throws, mounted on a tiny
// throwaway express() app.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import app from '../src/app.js';
import { createHealthRouter } from '../src/routes/health.routes.js';
import { pool } from '../src/database/pool.js';
import { closePool } from './helpers/cleanup.js';

after(async () => {
  await closePool();
});

test('GET /health answers 200 ok without touching PostgreSQL', async () => {
  // Bonus proof: sabotage every pool.query for the duration of the test
  // and /health must still answer 200 — liveness never depends on the DB.
  const realQuery = pool.query.bind(pool);
  pool.query = async () => { throw new Error('database down'); };
  try {
    const response = await request(app).get('/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  } finally {
    pool.query = realQuery;
  }
});

test('GET /ready answers 200 when PostgreSQL responds', async () => {
  // The default check runs SELECT 1 against the real (local) database.
  const response = await request(app).get('/ready');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ready', database: 'available' });
});

test('GET /ready answers 503 when the database check fails', async () => {
  const mini = express();
  mini.use(createHealthRouter({
    checkDatabase: async () => { throw new Error('injected outage'); }
  }));

  const response = await request(mini).get('/ready');
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: 'not_ready', database: 'unavailable' });
});

test('the readiness response never reveals connection details', async () => {
  const mini = express();
  mini.use(createHealthRouter({
    checkDatabase: async () => {
      throw new Error('connection refused on host db.internal.example.com port 6543');
    }
  }));

  const response = await request(mini).get('/ready');
  assert.equal(response.status, 503);
  assert.ok(!response.text.includes('db.internal.example.com'));
  assert.ok(!response.text.includes('6543'));
});