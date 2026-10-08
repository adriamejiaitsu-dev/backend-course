-- 001_create_requests.sql
-- El recurso request tal como se modeló en la clase 3, traducido al idioma de la base.
-- Cada restricción defiende una regla del dominio en el lugar donde los datos viven.

CREATE TABLE requests (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium',
  status      VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT requests_priority_check
    CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT requests_status_check
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled'))
);
