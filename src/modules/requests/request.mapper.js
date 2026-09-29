// The single bridge between SQL rows (snake_case) and the HTTP
// representation the contract promises (camelCase). A row is not
// automatically the HTTP response.

export function mapRequestRow(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdBy: row.created_by,
    // FEATURE-801. NULL means "nobody has claimed it", and the contract
    // promises a null there — not an absent field. Normalizing keeps the
    // shape stable for every request, assigned or not.
    assignedTo: row.assigned_to ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapHistoryEventRow(row) {
  // Each event type exposes ONLY its own fields. changed_by stays internal:
  // the contract of FEATURE-206 does not include it.
  if (row.type === 'priority_changed') {
    return {
      id: Number(row.id),
      type: row.type,
      fromPriority: row.from_priority,
      toPriority: row.to_priority,
      createdAt: row.created_at
    };
  }
  return {
    id: Number(row.id),
    type: row.type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    createdAt: row.created_at
  };
}
