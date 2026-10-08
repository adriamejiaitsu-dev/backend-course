# Test matrix — Entrega 04

> Fase 1: se declara lo **esperado**. Fase 6: cada caso se ejecuta y se registra lo
> **observado** (línea de estado literal y cuerpo). La columna observado se llena
> ejecutando, no copiando.
>
> Ejecución: servidor en `http://localhost:3000` (puerto local; la base vive en Supabase).
> Solicitudes con `curl`/`fetch`. Migraciones 001/002 y `seed.sql` aplicadas desde los
> archivos del repositorio (ver `README.md` de la clase). El caso de base caída (C19) se
> corre en un proceso con `PORT=3001` y una `DATABASE_URL` deliberadamente rota, sin tocar
> el `.env` real.

| Caso | Estado previo | Acción | Esperado | Observado |
| ---- | ------------- | ------ | -------- | --------- |
| Conectar correctamente | Proyecto activo | `npm run db:check` | Éxito: conexión, `requests` y `request_status_history` presentes | `- Database reached: postgres`; `- requests: present`; `- request_status_history: present`; `- requests count: 3`; `- status history count: 4`; `db:check OK` |
| Crear solicitud | — | `POST /requests` con `{"title":"Matrix persistence subject","description":"created to prove persistence"}` | `201` con `id`, `status:"open"`, fechas y evento de nacimiento | `201 {"id":5,...,"status":"open","createdAt":"2026-10-08T13:45:18.164Z","updatedAt":"2026-10-08T13:45:18.164Z"}`. Su historial nació con `{"previousStatus":null,"newStatus":"open"}` (mismo `changedAt` 13:45:18.164Z) |
| Reiniciar servidor | Solicitud creada | Detener y volver a arrancar Express, luego `GET /requests/5` | Persiste: mismo `id`, mismos datos | Reinicio: `Request API v4 is running on http://localhost:3000`. `GET /requests/5` → `200 {"id":5,...,"status":"open","createdAt":"2026-10-08T13:45:18.164Z","updatedAt":"2026-10-08T13:45:18.164Z"}` — los mismos `createdAt`/`updatedAt` del `201`: los datos no son del proceso |
| Buscar inexistente | — | `GET /requests/999999` | `404` `{error:{code:"REQUEST_NOT_FOUND"}}` | `404 {"error":{"code":"REQUEST_NOT_FOUND","message":"Request 999999 not found"}}` |
| Filtrar sin resultados | — | `GET /requests?status=closed` con ninguna cerrada | `200` `[]` | `200 []` |
| Cambiar prioridad | Solicitud `open` | `PATCH /requests/1` con `{"priority":"high"}` | `200` con `updatedAt` nuevo y **sin** evento en la historia | `200 {"priority":"high","status":"open","updatedAt":"2026-10-08T13:45:19.659Z"}` (nuevo; `createdAt` intacto). Historial antes y después solo con el nacimiento: 1 evento |
| Transición válida | Solicitud `open` | `PATCH /requests/1` con `{"status":"in_progress"}` | `200` y evento `open → in_progress` en la historia | `200 {"status":"in_progress","updatedAt":"2026-10-08T13:45:20.449Z"}`. Historial: `[{"previousStatus":null,"newStatus":"open","changedAt":"13:40:20.957Z"},{"previousStatus":"open","newStatus":"in_progress","changedAt":"13:45:20.449Z"}]` |
| Transición inválida | Solicitud `open` | `PATCH /requests/1` con `{"status":"closed"}` | `409` `INVALID_STATUS_TRANSITION` y **ninguna** escritura | `409 {"error":{"code":"INVALID_STATUS_TRANSITION","message":"Cannot move a request from \"open\" to \"closed\""}}`. Tras el `409`: `GET /requests/1` → `200` con `status:"open"` y `updatedAt` sin cambio (13:45:19.659Z); historial sigue con 1 evento: cero escrituras |
| Consultar historia | Transición hecha | `GET /requests/1/history` | `200` con los eventos en orden cronológico | `200 [{"previousStatus":null,"newStatus":"open","changedAt":"2026-10-08T13:40:20.957Z"},{"previousStatus":"open","newStatus":"in_progress","changedAt":"2026-10-08T13:45:20.449Z"}]` |
| Falla del historial | Solicitud `open` | Cambio transaccional con fallo forzado en el `INSERT` de historia | Error de base + `ROLLBACK` y `requests` intacto: `open` sigue siendo `open` y no queda evento parcial | Repro en SQL real (misma secuencia que el `store`): `UPDATE requests SET status='in_progress' WHERE id=3` → 1 fila; `INSERT ... new_status='purple'` → rechazado `SQLSTATE 23514` (`request_status_history_new_check`); `ROLLBACK`. Tras el rollback: `status = open`, historial del id 3 sin cambios (1 evento, el nacimiento). En la API ese escenario no se alcanza: la aplicación valida los cinco estados antes del SQL; la base es la segunda línea de defensa |
| Base no disponible | Base inalcanzable (URL rota, `127.0.0.1:1`) | Cualquier consulta | `503` `DATABASE_UNAVAILABLE`, la API sigue viva | `503 {"error":{"code":"DATABASE_UNAVAILABLE","message":"The database is not available right now"}}` en `GET /requests`, `GET /requests/5` y `GET /requests?status=open` seguidos: el proceso no muere, responde lo mismo tres veces. Log interno sanitizado: `[db] GET /requests -> 503 DATABASE_UNAVAILABLE (pg: n/a)` |
| Reinicio de Express | Datos existentes | Detener y volver a arrancar el servidor, luego `GET /requests` | Los datos siguen ahí (la prueba reina) | Tras el reinicio, `GET /requests` → `200` con las 7 filas: los 3 del seed + id 4, 5, 6, 7 creados y el título inyectado (`x'; DROP TABLE requests; --`) guardado literal. `db:check` posterior: `requests: present` |

## Casos propios (mínimo dos)

| Caso | Estado previo | Acción | Esperado | Observado |
| ---- | ------------- | ------ | -------- | --------- |
| `status` enviado al crear | — | `POST /requests` con `{"title":"Status must be ignored","status":"closed"}` | `201` con `status:"open"`: el servidor ignora el intento | `201 {"id":6,...,"description":null,"priority":"medium","status":"open"}` — el `status` del body quedó descartado |
| Filtro combinado | Datos con estados y prioridades mezclados | `GET /requests?status=open&priority=high` | `200` solo con las filas que cumplen ambas | `200 [{"id":1,"title":"Projector does not turn on","priority":"high","status":"open",...}]` — solo la fila `open` + `high` |
| SQL injection literales en el título | — | `POST /requests` con `title = "x'; DROP TABLE requests; --"` | `201` y el título guardado tal cual; `requests` sigue existiendo | `201 {"id":7,"title":"x'; DROP TABLE requests; --","priority":"medium","status":"open"}`. El texto es dato, no instrucción; `db:check` posterior confirma `requests: present` con datos |
| `:id` no numérico | — | `GET /requests/abc` | `404` `REQUEST_NOT_FOUND` (contrato v3 intacto, no un `500` de pg) | `404 {"error":{"code":"REQUEST_NOT_FOUND","message":"Request abc not found"}}` — no se consulta la base: no hay recurso con esa forma |

## Evidencia clave (texto, sin secretos)

### Persistencia tras reinicio

```txt
$ npm start
Request API v4 is running on http://localhost:3000

# antes del reinicio
POST /requests  {"title":"Matrix persistence subject","description":"created to prove persistence"}
HTTP 201  {"id":5,...,"status":"open","createdAt":"2026-10-08T13:45:18.164Z","updatedAt":"2026-10-08T13:45:18.164Z"}

# Ctrl + C, npm start de nuevo
Request API v4 is running on http://localhost:3000

GET /requests/5
HTTP 200  {"id":5,...,"createdAt":"2026-10-08T13:45:18.164Z","updatedAt":"2026-10-08T13:45:18.164Z"}
# los mismos instantes: el dato vivió fuera del proceso, en PostgreSQL (Supabase)
```

### Rollback demostrado

```txt
Target: request 3 (status before: open)
[ok] UPDATE requests SET status = in_progress ... (1 row)
[FAIL] INSERT of the history event rejected by the database: SQLSTATE 23514
  (new row for relation "request_status_history" violates check constraint
   "request_status_history_new_check")
[ok] ROLLBACK executed: the UPDATE is discarded with it

State of request 3 after ROLLBACK: status = open
History events for request 3: 1 (unchanged, no partial event was written)
```

Cómo se provocó (controladamente y sin tocar el esquema): se ejecutó la misma secuencia que
el `store` (UPDATE + INSERT de historia) dentro de una transacción real, pero con
`new_status = 'purple'` — ajeno al `CHECK` — para que PostgreSQL rechazara la segunda
escritura. Resultado: el `UPDATE` de `requests` también se deshizo (de ahí el `ROLLBACK`).
Cómo se revirtió: el `ROLLBACK` ya lo revierte todo; no queda nada que limpiar (0 eventos
parciales, 0 filas de estado fantasma).