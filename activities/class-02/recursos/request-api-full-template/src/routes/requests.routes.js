import express from 'express';
import { requests, generateId } from '../data/requests.js';

const router = express.Router();

// This router is mounted at /requests in app.js, so '/' here means GET /requests.

router.get('/', (req, res) => {
  // TODO: return the full list of requests with status 200.
  // The body must be a JSON array, even when the list is empty.
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/:id', (req, res) => {
  // TODO: find the request whose id matches req.params.id (it arrives as a string).
  // Found     -> 200 with the request object as JSON.
  // Not found -> 404 with a JSON body such as { "error": "Request not found" }.
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/', (req, res) => {
  // TODO: create a request from req.body.
  // Missing or blank title -> 400 with { "error": "Title is required" } and no data change.
  // Valid input            -> 201 with the created request as JSON.
  // Use generateId() for the id, set status to 'open', and push the object into requests.
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
