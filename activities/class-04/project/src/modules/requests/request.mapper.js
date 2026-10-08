// Row -> representation. The only place where snake_case rows become the
// camelCase JSON shape the HTTP contract promises (and where BIGINT ids and
// timestamps leave PostgreSQL's native types behind).

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

export function mapRequestRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description ?? null,
    priority: row.priority,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

export function mapHistoryRow(row) {
  if (!row) return null;
  return {
    previousStatus: row.previous_status ?? null,
    newStatus: row.new_status,
    changedAt: toIso(row.changed_at)
  };
}
