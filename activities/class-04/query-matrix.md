# Query matrix — Entrega 04

> Fase 1 · cada operación con su SQL (parametrizado) y sus parámetros. El SQL de esta
> matriz debe coincidir con el que termine en el store — si divergen, actualiza la matriz.

Columnas de la tabla `requests`:
`id, title, description, priority, status, created_at, updated_at`.
Columnas de `request_status_history`:
`id, request_id, previous_status, new_status, changed_at`.

| Operación | SQL | Parámetros | Resultado esperado |
| --------- | --- | ---------- | ------------------ |
| Listar | `SELECT id, title, description, priority, status, created_at, updated_at FROM requests ORDER BY id` | — | Todas las filas (arreglo, puede ser `[]`) |
| Buscar por ID | `SELECT … FROM requests WHERE id = $1` | `$1` = id | Una fila o ausencia (`null`) |
| Crear | `INSERT INTO requests (title, description, priority) VALUES ($1, $2, $3) RETURNING id, title, description, priority, status, created_at, updated_at` | `title`, `description`, `priority` | Fila creada; `id`, `status='open'` y fechas los pone la base |
| Registrar nacimiento | `INSERT INTO request_status_history (request_id, previous_status, new_status) VALUES ($1, NULL, 'open')` | `id` de la fila creada | Un evento `NULL → open` |
| Filtrar estado | `SELECT … FROM requests WHERE status = $1 ORDER BY id` | `$1` = estado válido | Colección (puede ser `[]`) |
| Filtrar combinado | `SELECT … FROM requests WHERE status = $1 AND priority = $2 ORDER BY id` | `$1` = estado, `$2` = prioridad | Colección filtrada por ambas condiciones |
| Actualizar campos (sin `status`) | `UPDATE requests SET title = COALESCE($2, title), description = COALESCE($3, description), priority = COALESCE($4, priority), updated_at = NOW() WHERE id = $1 RETURNING …` | `$1` = id, `$2..$4` = cambios opcionales | Fila actualizada o ausencia |
| Actualizar estado (con `status`) | `UPDATE requests SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING …` + `INSERT INTO request_status_history (request_id, previous_status, new_status) VALUES ($1, $3, $2)` — **ambas dentro de la misma transacción** | `$1` = id, `$2` = nuevo estado, `$3` = estado anterior | Fila actualizada + evento de historia |
| Consultar historia | `SELECT previous_status, new_status, changed_at FROM request_status_history WHERE request_id = $1 ORDER BY changed_at ASC, id ASC` | `$1` = id de la solicitud | Eventos en orden cronológico (arreglo, puede ser `[]`) |

## Comprobación de seguridad

Revisada la columna SQL: **ningún valor del cliente aparece dentro del texto de la
consulta**. Los identificadores (`requests`, `request_status_history`, nombres de
columna) son fijos en el código; los valores siempre viajan como `$1, $2, $3`.

Casos que verifican que así sea (aparecen en la matriz de pruebas):

* `GET /requests?status=open` y el filtro combinado: el valor viaja como parámetro.
* `POST /requests` con `title` conteniendo comillas y `$1` literales
  (`"Monitor's arm $1 DROP"`): debe guardarse tal cual y no romper la consulta.
* `PATCH /requests/:id` con `status`: el valor se compara contra la máquina de estados
  antes de tocar la base; el `CHECK` de la base es la segunda muralla.

Si alguna fila de esta matriz se ejecuta uniendo cadenas, esta sección deja de ser cierta:
hay que corregirla **antes** de implementar.
