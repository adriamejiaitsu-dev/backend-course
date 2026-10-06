import express from 'express';
import {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
  PRIORITIES
} from './requests.store.js';
import { isKnownStatus } from './request-status.js';

const router = express.Router();

// Fields the client is allowed to modify. id, createdAt and updatedAt are not
// here: they are ignored when they arrive, never applied.
const MODIFIABLE_FIELDS = ['title', 'description', 'priority', 'status'];

// This router is mounted at /requests in app.js, so '/' here means GET /requests.

router.get('/', (req, res) => {
  const { status } = req.query;

  if (status !== undefined && !isKnownStatus(status)) {
    return res.status(400).json({ error: `Unknown status value "${status}"` });
  }

  res.status(200).json(listRequests({ status }));
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const request = getRequestById(id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  res.status(200).json(request);
});

router.post('/', (req, res) => {
  const body = req.body ?? {};

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    return res.status(400).json({ error: `Unknown priority value "${body.priority}"` });
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  // id, status, createdAt, updatedAt and any unknown field are dropped on purpose:
  // the server owns them. The contract documents this as "ignored", not "rejected".
  const newRequest = createRequest({
    title,
    description: body.description,
    priority: body.priority
  });

  res.status(201).json(newRequest);
});

router.patch('/:id', (req, res) => {
  const body = req.body ?? {};
  const id = Number(req.params.id);

  // 1. Shape first: the request is judged on its own before any state is read.
  const sentFields = MODIFIABLE_FIELDS.filter((field) => body[field] !== undefined);
  if (sentFields.length === 0) {
    return res.status(400).json({
      error: 'Patch body requires at least one of: title, description, priority, status'
    });
  }

  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    return res.status(400).json({ error: `Unknown priority value "${body.priority}"` });
  }

  if (body.status !== undefined && !isKnownStatus(body.status)) {
    return res.status(400).json({ error: `Unknown status value "${body.status}"` });
  }

  // 2. Then the resource, 3. then the rule (409) — both decided by the store.
  const outcome = updateRequest(id, {
    title: body.title,
    description: body.description,
    priority: body.priority,
    status: body.status
  });

  if (!outcome.ok) {
    if (outcome.code === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({ error: outcome.message });
    }
    return res.status(409).json({ error: outcome.message });
  }

  res.status(200).json(outcome.request);
});

export default router;
