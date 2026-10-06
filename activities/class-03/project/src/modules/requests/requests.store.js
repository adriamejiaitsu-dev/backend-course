// In-memory storage. There is no database: the data resets on every restart.
// This file administers the array and the identity of the requests. It does not
// know what an HTTP status code is.

const requests = [
  {
    id: 1,
    title: 'Projector does not turn on',
    description: 'The projector in room 204 shows no image during class.',
    status: 'open',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Broken chair in the lab',
    description: 'One chair in the computer lab has a loose back rest.',
    status: 'in_progress',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Wi-Fi drops in the library',
    description: 'The connection drops every few minutes on the second floor.',
    status: 'open',
    priority: 'low'
  }
];

// Identifier for the next request that gets created. It only moves forward:
// it does not repeat ids while the process lives, and it restarts on every reboot.
let nextId = 4;

// Returns every request, optionally narrowed by known status values.
export function listRequests(filters = {}) {
  return requests.filter((request) => {
    if (filters.status !== undefined && request.status !== filters.status) {
      return false;
    }
    return true;
  });
}

export function getRequestById(id) {
  return requests.find((request) => request.id === id);
}

export function createRequest(fields) {
  const newRequest = {
    id: nextId,
    title: fields.title,
    description: fields.description,
    status: 'open',
    priority: fields.priority
  };

  nextId = nextId + 1;
  requests.push(newRequest);

  return newRequest;
}
