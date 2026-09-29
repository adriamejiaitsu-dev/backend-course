// HTTP layer of the requests module: it extracts path, query, body and
// the authenticated actor, invokes the operation and answers. It contains
// no SQL and no domain rules.
//
// Class 08, step 2: the history handler that used to live here did
// EVERYTHING (validation, SQL, visibility, mapping, response). It now
// reads the path, calls the service and answers. Same status, same body,
// same codes — the contract did not move.

import express from 'express';
import {
  listRequests,
  getRequest,
  listRequestHistory,
  createRequest,
  patchRequest
} from './requests.service.js';
import { parseIdParam } from '../../http/parse-id.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { status, priority } = req.query;
  res.status(200).json(await listRequests(req.auth, { status, priority }));
});

router.get('/:id', async (req, res) => {
  const id = parseIdParam(req.params.id);
  res.status(200).json(await getRequest(req.auth, id));
});

// ─────────────────────────────────────────────────────────────────────
// GET /:id/history — thin again. Everything that made this handler
// "do everything" now lives where it belongs: the id is validated at the
// HTTP boundary, the service coordinates, the policy decides visibility,
// the store runs SQL and the mapper builds each event.
// ─────────────────────────────────────────────────────────────────────
router.get('/:id/history', async (req, res) => {
  const id = parseIdParam(req.params.id);
  res.status(200).json(await listRequestHistory(req.auth, id));
});

router.post('/', async (req, res) => {
  res.status(201).json(await createRequest(req.auth, req.body));
});

router.patch('/:id', async (req, res) => {
  const id = parseIdParam(req.params.id);
  res.status(200).json(await patchRequest(req.auth, id, req.body));
});

export default router;
