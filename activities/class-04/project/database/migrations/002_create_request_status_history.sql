-- 002_create_request_status_history.sql
-- Cada cambio de estado es un HECHO con su propia fila. La FK impide historia
-- huérfana; previous_status admite NULL porque el nacimiento no viene de ningún
-- estado (NULL -> open).

CREATE TABLE request_status_history (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id      BIGINT NOT NULL,
  previous_status VARCHAR(30),
  new_status      VARCHAR(30) NOT NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT request_status_history_request_fk
    FOREIGN KEY (request_id) REFERENCES requests(id),
  CONSTRAINT request_status_history_previous_check
    CHECK (previous_status IS NULL OR previous_status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
  CONSTRAINT request_status_history_new_check
    CHECK (new_status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled'))
);
