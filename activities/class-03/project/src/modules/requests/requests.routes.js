import express from 'express';
import { listRequests, getRequestById, createRequest } from './requests.store.js';
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
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newRequest = createRequest({
    title,
    description: req.body.description,
    priority: req.body.priority
  });

  res.status(201).json(newRequest);
});

export default router;
