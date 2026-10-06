// OPS-703 · Operational endpoints.
//
// Two DIFFERENT questions:
//   GET /health  "Is the process alive?"        -> never touches PostgreSQL
//   GET /ready   "Can it do useful work now?"   -> checks PostgreSQL cheaply
import express from 'express';
import { pool } from '../database/pool.js';

export function createHealthRouter({ checkDatabase } = {}) {
  const router = express.Router();

  // Liveness answers even when the database is down: the process is alive
  // and that is all it claims. A health probe that depended on PostgreSQL
  // would make an operator restart a healthy process for no reason.
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Readiness answers the exact question "can it do useful work now?".
  // The check is INJECTABLE so a test can hand in a failing function
  // without touching real credentials; by default it runs the cheapest
  // possible real query (SELECT 1 proves connection + auth + roundtrip).
  router.get('/ready', async (req, res) => {
    const check = checkDatabase ?? (async () => { await pool.query('SELECT 1'); });
    try {
      await check();
      res.status(200).json({ status: 'ready', database: 'available' });
    } catch {
      // A deliberate 503 — the failure IS the expected answer. It reveals
      // nothing: no host, no port, no user, no SQL, no stack.
      res.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
  });

  return router;
}

export const healthRoutes = createHealthRouter();