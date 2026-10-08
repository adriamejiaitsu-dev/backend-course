-- seed.sql — datos de ejemplo reproducibles. No borra nada: el flujo normal
-- nunca destruye datos. Ejecutar en el SQL Editor después de las migraciones.

INSERT INTO requests (title, description, priority, status)
VALUES
  ('Projector does not turn on', 'The projector in room 204 shows no image during class.', 'high', 'open'),
  ('Broken chair in the lab', 'One chair in the computer lab has a loose back rest.', 'medium', 'in_progress'),
  ('Wi-Fi drops in the library', 'The connection drops every few minutes on the second floor.', 'low', 'open');

-- Historia coherente con los estados sembrados (el nacimiento siempre existe).
INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, NULL, 'open' FROM requests WHERE status = 'open';

INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, NULL, 'open' FROM requests WHERE status = 'in_progress';

INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, 'open', 'in_progress' FROM requests WHERE status = 'in_progress';
