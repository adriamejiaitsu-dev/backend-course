// Traceability tests.
//
// The hard part is not asserting what the logs contain, but what they do
// NOT contain: capture console.log/console.error during a request and
// inspect the lines. (The request logger writes on the response 'finish'
// event — wait a few milliseconds before restoring the console.)
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setTimeout as sleep } from 'node:timers/promises';
import app from '../src/app.js';
import { createUser } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

test('every response carries an X-Request-Id header', async () => {
  const response = await request(app).get('/health');
  assert.ok(response.headers['x-request-id']);
});

test('an error body carries the same requestId as the header', async () => {
  const owner = await createUser({ name: 'corr' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/999999999')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.requestId, response.headers['x-request-id']);
});

test('a well-formed client X-Request-Id is kept', async () => {
  const response = await request(app)
    .get('/health')
    .set('X-Request-Id', 'frontend-trace-42');

  assert.equal(response.headers['x-request-id'], 'frontend-trace-42');
});

test('a suspicious client X-Request-Id is replaced, never trusted', async () => {
  const junk = 'A'.repeat(300);
  const response = await request(app)
    .get('/health')
    .set('X-Request-Id', junk);

  const id = response.headers['x-request-id'];
  assert.match(id, /^req_/); // server-generated, not the echo of the junk
  assert.notEqual(id, junk);
});

test('the log line of a request carries the same requestId as the response', async () => {
  const owner = await createUser({ name: 'logcorr' });
  const token = await loginAs(owner);

  const lines = [];
  const realLog = console.log;
  const realError = console.error;
  console.log = (entry) => lines.push(String(entry));
  console.error = (entry) => lines.push(String(entry));
  try {
    const response = await request(app)
      .get('/requests/999999999')
      .set('Authorization', `Bearer ${token}`);
    await sleep(80);

    const headerId = response.headers['x-request-id'];
    const parsed = lines
      .map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);
    assert.ok(parsed.some((entry) => entry.requestId === headerId));
  } finally {
    console.log = realLog;
    console.error = realError;
  }
});

test('the Authorization header and the token never reach the log', async () => {
  const owner = await createUser({ name: 'leak' });
  const token = await loginAs(owner);

  const lines = [];
  const realLog = console.log;
  const realError = console.error;
  console.log = (entry) => lines.push(String(entry));
  console.error = (entry) => lines.push(String(entry));
  try {
    await request(app).get('/requests').set('Authorization', `Bearer ${token}`);
    await request(app)
      .get('/requests/999999999')
      .set('Authorization', `Bearer ${token}`);
    await sleep(80);
  } finally {
    console.log = realLog;
    console.error = realError;
  }

  const leaky = lines.filter((line) =>
    line.includes(token) || /Bearer /.test(line) || /authorization/i.test(line));
  assert.deepEqual(leaky, []);
});