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

// Every failure of this API answers with the same shape: a code for programs and
// a message for people. No handler builds an error body by hand.
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

// This router is mounted at /requests in app.js, so '/' here means GET /requests.

router.get('/', (req, res) => {
  const { status, priority } = req.query;

  // An unknown filter value is a client mistake, not an empty result:
  // returning [] would hide it.
  if (status !== undefined && !isKnownStatus(status)) {
    return sendError(res, 400, 'INVALID_FILTER_VALUE', `Unknown status value "${status}"`);
  }

  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return sendError(res, 400, 'INVALID_FILTER_VALUE', `Unknown priority value "${priority}"`);
  }

  res.status(200).json(listRequests({ status, priority }));
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const request = getRequestById(id);

  if (!request) {
    return sendError(res, 404, 'REQUEST_NOT_FOUND', `Request ${req.params.id} not found`);
  }

  res.status(200).json(request);
});

router.post('/', (req, res) => {
  const body = req.body ?? {};

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return sendError(res, 400, 'TITLE_REQUIRED', 'Title is required');
  }

  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    return sendError(res, 400, 'INVALID_PRIORITY_VALUE', `Unknown priority value "${body.priority}"`);
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    return sendError(res, 400, 'INVALID_DESCRIPTION_VALUE', 'Description must be a string');
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
    return sendError(
      res,
      400,
      'EMPTY_PATCH_BODY',
      'Patch body requires at least one of: title, description, priority, status'
    );
  }

  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return sendError(res, 400, 'TITLE_REQUIRED', 'Title is required');
    }
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    return sendError(res, 400, 'INVALID_DESCRIPTION_VALUE', 'Description must be a string');
  }

  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    return sendError(res, 400, 'INVALID_PRIORITY_VALUE', `Unknown priority value "${body.priority}"`);
  }

  if (body.status !== undefined && !isKnownStatus(body.status)) {
    return sendError(res, 400, 'INVALID_STATUS_VALUE', `Unknown status value "${body.status}"`);
  }

  // 2. Then the resource, 3. then the rule. The store decides both and returns a
  // domain outcome; this layer only translates it into HTTP.
  const outcome = updateRequest(id, {
    title: body.title,
    description: body.description,
    priority: body.priority,
    status: body.status
  });

  if (!outcome.ok) {
    const status = outcome.code === 'REQUEST_NOT_FOUND' ? 404 : 409;
    return sendError(res, status, outcome.code, outcome.message);
  }

  res.status(200).json(outcome.request);
});

export default router;
