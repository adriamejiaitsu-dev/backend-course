import express from 'express';
import { listRequests, getRequestById, createRequest, PRIORITIES } from './requests.store.js';
import { isKnownStatus } from './request-status.js';

const router = express.Router();

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

export default router;
