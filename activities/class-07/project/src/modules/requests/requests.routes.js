// HTTP layer of the requests module: it extracts path, query, body and
// the authenticated actor, invokes the operation, and translates results
// into HTTP responses; errors are forwarded to the central error handler
// (Express 5 forwards rejected promises on its own). It contains no SQL
// and no domain rules. The router assumes app.js mounted it behind
// `authenticate`, so req.auth is always present here.

import express from 'express';
import { AppError } from '../../app-error.js';
import {
  listRequests,
  getRequest,
  createRequest,
  patchRequest,
  getHistory
} from './requests.service.js';

const router = express.Router();

// The route is the FIRST place the system meets the :id parameter: a
// malformed value must be rejected here, before any SQL runs. A regex over
// the WHOLE string (not parseInt, which silently accepts "12abc") keeps
// only positive integers: no text, decimals, zeros or negatives.
function parseRequestId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new AppError('contract', 'INVALID_REQUEST_ID',
      'Request id must be a positive integer.');
  }
  return Number(raw);
}

router.get('/', async (req, res) => {
  const { status, priority } = req.query;
  res.status(200).json(await listRequests(req.auth, { status, priority }));
});

router.get('/:id', async (req, res) => {
  res.status(200).json(await getRequest(req.auth, parseRequestId(req.params.id)));
});

router.get('/:id/history', async (req, res) => {
  res.status(200).json(await getHistory(req.auth, parseRequestId(req.params.id)));
});

router.post('/', async (req, res) => {
  res.status(201).json(await createRequest(req.auth, req.body));
});

router.patch('/:id', async (req, res) => {
  res.status(200).json(await patchRequest(req.auth, parseRequestId(req.params.id), req.body));
});

export default router;