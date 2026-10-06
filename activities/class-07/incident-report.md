# Class 07 incident report

Completado MIENTRAS se investigaba. Hechos separados de interpretaciones;
las hipótesis viven en Hypotheses, no en Evidence.

## Baseline

Which command confirmed the starting state?

- `npm run class-07:doctor` -> 7/7 PASS, "Environment ready for incident response."
- `npm run db:migrate` -> 4 migraciones APPLIED (base local que simula Supabase de clase 06).
- `npm run db:seed` -> 2 requesters + 1 agent, 6 requests, 15 history events.
- `npm test` -> 20 pass / 17 todo / 0 fail (las 17 TODO son las pruebas a escribir).

## Incident 701

### Report

Soporte reporta que "some request identifiers return an internal server error":
un integrador construye enlaces hacia solicitudes y algunos responden 500.

### Reproduction

```
GET /requests/not-a-number
Authorization: Bearer <token de ana (requester)>
```

### Expected result

`400 INVALID_REQUEST_ID` con body `{ error: { code: "INVALID_REQUEST_ID", ... }, requestId }`.

### Actual result

```
Status: 500
Body:   { "error": { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred." } }
Terminal: error de PostgreSQL ("invalid input syntax for type bigint", query WHERE id = $1 con valor NaN)
```

### Hypotheses

1. (más probable) `Number(req.params.id)` convierte el texto a `NaN`, y ese `NaN` llega a la
   consulta SQL. Comprobación: leer `requests.routes.js` para ver dónde se convierte el id y
   confirmar que el valor viaja sin validar hasta `findById`.
2. La validación existe pero rechaza con un código distinto y el 500 viene de otro lado.
   Comprobación: seguir el parámetro ruta->service->store; si hubiera validación, habría AppError
   de tipo contract antes del SQL.
3. El error está en el store (PostgreSQL no soporta el tipo del parámetro).
   Comprobación: ver el mensaje exacto del terminal (contradice: el tipo es correcto, el VALOR es NaN).

### Evidence

- `requests.routes.js` línea `GET /:id`: `Number(req.params.id)` — primera vez que el sistema conoce el parámetro.
- `Number('not-a-number') === NaN` (REPL).
- `findById(NaN)` ejecuta `SELECT ... WHERE id = $1` con `NaN` -> PostgreSQL lanza
  `invalid input syntax for type bigint` -> 500.
- `parseInt('12abc') === 12`: un parseo ingenuo ACEPTA un id que el cliente nunca envió (por eso el fix usa regex sobre el string completo).

### Confirmed cause

La ruta no valida el formato del id en el límite HTTP. Un formato inválido se convierte en `NaN`
y viaja hasta la consulta SQL, donde PostgreSQL lo rechaza como error interno (500). La consulta
SQL no debería haberse ejecutado.

### Correction

`src/modules/requests/requests.routes.js`: nueva función `parseRequestId(raw)` que valida con
`/^[1-9]\d*$/` sobre el string COMPLETO (positivos sin decimales, sin cero, sin negativos, sin
`12abc`) y lanza `AppError('contract', 'INVALID_REQUEST_ID', ...)` antes de ejecutar SQL. Se
aplica a las 3 rutas con `:id` (GET, history, PATCH). Se conserva el `404 REQUEST_NOT_FOUND`
para ids bien formados que no existen.

### Regression test

`test/errors.test.js`:
- "an alphabetic id answers 400 INVALID_REQUEST_ID, not 500"
- "decimal, zero and negative ids are rejected the same way" (1.5, 0, -3, 12abc)
- "a well-formed id that matches nothing still answers 404"
Sin el fix, `GET /requests/not-a-number` devolvía 500 y las pruebas fallaban; con el fix, pasan.

## Incident 702

### Report

"Updating some priorities produces an internal server error": un agente marcó una solicitud como
'critical' desde una herramienta externa y recibió un 500 sin explicación.

### Reproduction

```
PATCH /requests/1
Authorization: Bearer <token de maria (agent)>
Content-Type: application/json
{ "priority": "critical" }
```

### Expected result

`400 INVALID_PRIORITY` con message "Priority must be low, medium or high." y restricción CHECK viva.

### Actual result

```
Status: 500
Body:   { "error": { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred." } }
Terminal: violación de la restricción CHECK requests_priority_check (PostgreSQL rechazó 'critical')
```

### Hypotheses

1. (más probable) La aplicación NO valida `priority` en el camino de escritura (solo filtra y
   valida status/title); el valor inválido llega a SQL y la restricción CHECK lo rechaza -> 500.
   Comprobación: leer `patchRequest`/`createRequest` en `requests.service.js` y ver la
   "asimetría": validación en filtros, ausencia en escrituras.
2. La restricción no existe y el 500 viene de otra columna. Comprobación: revisar migración 004
   (la restricción `requests_priority_check` SÍ existe).
3. El error es del rol (403) mal traducido. Comprobación: reproducir con agente (los agents SÍ
   pueden cambiar prioridad).

### Evidence

- Terminal: `check_violation` en `requests_priority_check` -> la BASE protegió la integridad.
- `requests.service.js`: `listRequests` valida filtros (`INVALID_FILTER`), pero `patchRequest` y
  `createRequest` validan title/status y NO priority.
- `SELECT conname FROM pg_constraint WHERE conname = 'requests_priority_check'` -> existe (segunda defensa).
- Con `POST { priority: "urgent" }` también se repetía el 500 (ambos caminos de escritura).

### Confirmed cause

Dos defensas en juego: la aplicación no valida el contrato (primera defensa ausente), por eso el
valor inválido llega a la base; la restricción CHECK actuó como segunda defensa y rechazó el dato,
pero el error interno (500) es un problema de contrato del sistema.

### Correction

`src/modules/requests/requests.service.js`: validación de contrato en los DOS caminos de escritura.
- `createRequest`: si `priority` viene y no está en `['low','medium','high']` -> `INVALID_PRIORITY`.
- `patchRequest`: misma regla dentro de la validación de `changes`.
La restricción CHECK `requests_priority_check` se conserva intacta (verificada en `pg_constraint`).

### Regression test

`test/errors.test.js`:
- "an invalid priority answers 400 INVALID_PRIORITY before touching SQL"
- "a valid priority change still works after the fix" (low -> high por agente -> 200)
Sin el fix el PATCH con 'critical' devolvía 500 (fallaba); la prueba del caso válido asegura que
el fix no rompe lo que ya funcionaba.

## Error flow

Where is the error created?
- AppError tipados: en el servicio (contrato, política, dominio), en la ruta (`INVALID_REQUEST_ID`),
  en `authenticate` (auth) y en `notFound` (`ROUTE_NOT_FOUND`). Los errores inesperados nacen en
  SQL / dependencias sin traducir.

How does it reach the error middleware?
- Express 5 reenvía automáticamente los errores lanzados (throw) y las promesas rechazadas de
  cualquier ruta/middleware anterior hacia el middleware de errores registrado al final de
  app.js. Ya no hay try/catch por ruta.

What is returned to the client?
- El body de error con el mismo formato SIEMPRE: `{ error: { code, message }, requestId }`.
  Códigos según categoría: contract 400, auth 401, forbidden 403, resource 404, domain 409;
  body inválido 400 INVALID_JSON; base caída 503 DATABASE_UNAVAILABLE; el resto 500 INTERNAL_ERROR.

What remains only in the server log?
- El `name`, `message` y `stack` del error inesperado (evento `unexpected_error`), el requestId que
  lo correlaciona, el código de la base caída (evento `database_unavailable`). Nunca datos internos:
  no SQL, no nombres de tablas, no cadenas de conexión, no headers.

## Request ID

How did I prove that the response and log belong to the same request?

`npm run incidents:reproduce` imprimió la línea de log del caso OPS-703 con el MISMO requestId
que el header y el body:

```
GET /requests/999999999  -> 404 REQUEST_NOT_FOUND
header: req_4af73907-...
body.requestId: req_4af73907-...   (igual)
log:  { ... "requestId":"req_4af73907-...", "status":404, "errorCode":"REQUEST_NOT_FOUND" }
```

Además, la prueba "the log line of a request carries the same requestId as the response" captura
el console durante una petición, parsea cada línea y comprueba que una línea tiene exactamente el
requestId del header de la respuesta.

## AI assistance

What did AI help me understand?
- Que el error se origina donde se convierte `req.params.id` (ruta), no donde falla la base
  ("appears vs originates"); que Express 5 reenvía errores solo con el middleware de 4 parámetros
  registrado al final; la diferencia entre la red de defensa de la aplicación y la de PostgreSQL.

Which hypothesis did it propose?
- Para INC-701: "el parámetro se convierte a NaN y viaja a PostgreSQL" (la más probable).
- Para INC-702: "la aplicación no valida priority en el camino de escritura" (la más probable).

How did I verify it?
- Leyendo el código real (routes/service/store) con el REPL: `Number('not-a-number')` = NaN y
  `parseInt('12abc')` = 12; verificando la restricción en `pg_constraint`; reproduciendo con
  agentes y con POST. Cada hipótesis se confirmó con evidencia del sistema, no por confianza.

What suggestion was incomplete or incorrect?
- La opción "validar más cerca de SQL (en el store)" se descartó: es tarde, la invalidación debe
  ocurrir donde el sistema conoce el valor por primera vez (límite HTTP).
- El intento ingenuo de usar `parseInt` se descartó porque acepta '12abc' como 12.

## Remaining doubt

What part do I still not understand?

(Queda como duda propia del estudiante: p. ej., cómo se propaga el requestId si el backend creciera
a varios servicios, o cómo escalaría el error handler si hubiera respuestas de streaming.)