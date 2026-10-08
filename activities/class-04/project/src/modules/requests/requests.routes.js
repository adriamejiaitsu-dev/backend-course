// HTTP layer. Validation decides what shape is acceptable (400), the service
// decides the domain outcome (404 / 409), and this file translates both into
// HTTP. Handlers are async: Express 5 forwards rejected promises to the error
// middleware, which is the only place that builds a database error body.
import express from 'express';
import * as service from './requests.service.js';
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

// The :id path parameter arrives as text. The class 03 contract treats a
// non numeric id exactly as an id that does not exist: 404 REQUEST_NOT_FOUND.
// Nuance check: it is a contract-compatible shortcut. The server never sends
// "abc" to PostgreSQL, where it would be an "invalid input syntax" error.
function parseRequestId(rawId) {
  if (!/^\d+$/.test(String(rawId ?? ''))) return null;
  return Number(rawId);
}

function filterError(res, value, kind) {
  return sendError(res, 400, 'INVALID_FILTER_VALUE', `Unknown ${kind} value "${value}"`);
}

// This router is mounted at /requests in app.js, so '/' here means GET /requests.

router.get('/', async (req, res) => {
  const { status, priority } = req.query;

  // An unknown filter value is a client mistake, not an empty result:
  // returning [] would hide it.
  if (status !== undefined && !isKnownStatus(status)) {
    return filterError(res, status, 'status');
  }

  if (priority !== undefined && !service.isKnownPriority(priority)) {
    return filterError(res, priority, 'priority');
  }

  const requests = await service.list({ status, priority });
  res.status(200).json(requests);
});

router.get('/:id/history', async (req, res) => {
  const id = parseRequestId(req.params.id);
  if (id === null) {
    return sendError(res, 404, 'REQUEST_NOT_FOUND', `Request ${req.params.id} not found`);
  }

  // Existence first: the history of something that does not exist is 404, the
  // same answer the resource endpoint gives for the same id.
  const history = await service.getHistory(id);
  if (history === null) {
    return sendError(res, 404, 'REQUEST_NOT_FOUND', `Request ${req.params.id} not found`);
  }

  res.status(200).json(history);
});

router.get('/:id', async (req, res) => {
  const id = parseRequestId(req.params.id);
  if (id === null) {
    return sendError(res, 404, 'REQUEST_NOT_FOUND', `Request ${req.params.id} not found`);
  }

  const request = await service.getById(id);
  if (!request) {
    return sendError(res, 404, 'REQUEST_NOT_FOUND', `Request ${req.params.id} not found`);
  }

  res.status(200).json(request);
});

router.post('/', async (req, res) => {
  const body = req.body ?? {};

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return sendError(res, 400, 'TITLE_REQUIRED', 'Title is required');
  }

  if (body.priority !== undefined && !service.isKnownPriority(body.priority)) {
    return sendError(res, 400, 'INVALID_PRIORITY_VALUE', `Unknown priority value "${body.priority}"`);
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    return sendError(res, 400, 'INVALID_DESCRIPTION_VALUE', 'Description must be a string');
  }

  // id, status, createdAt, updatedAt and any unknown field are dropped on purpose:
  // the server owns them. The contract documents this as "ignored", not "rejected".
  const created = await service.create({
    title,
    description: body.description,
    priority: body.priority
  });

  res.status(201).json(created);
});

router.patch('/:id', async (req, res) => {
  const body = req.body ?? {};
  const id = parseRequestId(req.params.id);
  if (id === null) {
    return sendError(res, 404, 'REQUEST_NOT_FOUND', `Request ${req.params.id} not found`);
  }

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

  if (body.priority !== undefined && !service.isKnownPriority(body.priority)) {
    return sendError(res, 400, 'INVALID_PRIORITY_VALUE', `Unknown priority value "${body.priority}"`);
  }

  if (body.status !== undefined && !isKnownStatus(body.status)) {
    return sendError(res, 400, 'INVALID_STATUS_VALUE', `Unknown status value "${body.status}"`);
  }

  // 2. Then the resource, 3. then the rule. The service decides both and returns
  // a domain outcome; this layer only translates it into HTTP.
  const outcome = await service.update(id, {
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