# Persistence contract — operaciones del store

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Los contratos también existen entre módulos: este documento es la promesa del store
> hacia el service. Completa una sección por operación.

Operaciones: `findAll(filters)` · `findById(id)` · `create(input)` · `update(id, changes)` ·
`findHistory(requestId)`

Convención común a todas: el store trabaja con **filas** (`snake_case`) y devuelve
**representaciones** (`camelCase`) ya traducidas por `request.mapper.js`. Nunca devuelve
una fila cruda; nunca conoce `res` ni un código HTTP.

---

## `findAll(filters)`

* **Entrada**: `filters = { status?, priority? }`, ambos opcionales. Valores válidos ya
  verificados por la capa de rutas **antes** de llegar aquí (el store no valida el
  contrato HTTP; si recibe algo fuera del conjunto, el `CHECK` de la base sería el
  respaldo).
* **Consulta**: un `SELECT` con lista de columnas explícita sobre `requests`; las
  condiciones se agregan con `AND` solo cuando el filtro existe, y el valor viaja como
  parámetro (`$1`, `$2`), nunca dentro del texto de la consulta.
* **Salida**: arreglo de representaciones (puede ser vacío).
* **Ausencia de datos**: `[]` — una colección vacía es un `200`, no un error.
* **Errores posibles**: caída de la base (`503 DATABASE_UNAVAILABLE`); cualquier otro
  error de pg se envuelve y se propaga al traductor de errores.
* **¿Necesita transacción?**: no. Una sola lectura, sin estado compartido.
* **Mapeo**: `rows.map(mapRequestRow)`.

## `findById(id)`

* **Entrada**: `id` entero ya convertido por la ruta (un `:id` no numérico ni siquiera
  llega: `400 INVALID_REQUEST_ID`).
* **Consulta**: `SELECT … WHERE id = $1` con el id como parámetro.
* **Salida**: representación de la solicitud.
* **Ausencia de datos**: `null`. El store no distingue "no existe" de "no hay permiso"
  (no hay permisos en esta clase): `null` lo traduce la ruta en `404 REQUEST_NOT_FOUND`.
* **Errores posibles**: base no disponible (`503`).
* **¿Necesita transacción?**: no.
* **Mapeo**: `mapRequestRow(row)`.

## `create(input)`

* **Entrada**: `{ title, description?, priority? }` — ya validados por la ruta. Sin `id`,
  sin `status`, sin fechas: eso lo decide la base y el contrato.
* **Consulta(s)**: **dos escrituras**: (1) `INSERT INTO requests (title, description,
  priority) VALUES ($1,$2,$3) RETURNING …` — `id`, `status` (`open`) y las dos fechas los
  pone la base; (2) `INSERT INTO request_status_history (request_id, previous_status,
  new_status) VALUES ($1, NULL, 'open')` para registrar el nacimiento.
* **Salida**: la representación creada (la de la fila devuelta por `RETURNING`).
* **Errores posibles**: `23502` (`title` nulo — no debería pasar, la ruta ya valida),
  `23514` (violación de `CHECK`), `23505`, truncamiento `22001`, base no disponible
  (`503`).
* **¿Necesita transacción?**: **sí**. Si la solicitud se crea y la historia falla, quedaría
  una solicitud sin su nacimiento registrado — la misma inconsistencia que en `update`.
  Un solo cliente, `BEGIN/COMMIT`, `ROLLBACK` si algo falla.
* **Mapeo**: `mapRequestRow(row)` con la fila de `RETURNING`.

## `update(id, changes)`

* **Entrada**: `id` entero + `changes = { title?, description?, priority?, status? }`.
  El `status` llega **solo si la ruta ya validó la transición** con `checkUpdate` — el
  store no decide el dominio, lo aplica.
* **Consulta(s)**: la ruta de escritura depende del cambio:
  * sin `status` → un solo `UPDATE … SET (campos, updated_at = NOW()) WHERE id = $n
    RETURNING …`, sin historia (no hubo hecho de dominio).
  * con `status` → `UPDATE` de los campos + `UPDATE` de `status` + `INSERT` en la
    historia, **en la misma transacción** (ver `transaction-plan.md`).
* **Salida**: `{ ok: true, request }` o `{ ok: false, code, message }` (mismo contrato de
  dominio que en la clase 3: nada de códigos HTTP aquí).
* **Ausencia de datos**: `{ ok: false, code: 'REQUEST_NOT_FOUND', … }`.
* **Errores posibles**: base no disponible (`503`), violación de `CHECK` si un cambio
  escapó a la validación (`23514`), error inesperado de pg (se propaga tras `ROLLBACK`).
* **¿Necesita transacción?**: **sí cuando cambia `status`** (dos escrituras); no cuando
  solo cambian campos descriptivos (una escritura).
* **Mapeo**: `mapRequestRow(row)`.

## `findHistory(requestId)`

* **Entrada**: `id` de la solicitud (entero).
* **Consulta**: `SELECT h.previous_status, h.new_status, h.changed_at
  FROM request_status_history h WHERE h.request_id = $1 ORDER BY h.changed_at ASC,
  h.id ASC`. El orden importa: la historia se lee cronológicamente.
* **Salida**: arreglo de eventos `{ previousStatus, newStatus, changedAt }` (la clave
  foránea no se expone: ya está implícita en la URL).
* **Ausencia de datos**: aquí hay dos casos distintos y **quien los distingue es la ruta**
  — el store recibe el id solo: (a) si la solicitud no existe → `[]` no alcanza; por eso
  la ruta primero llama a `findById` y responde `404`; (b) existe y no tiene eventos →
  `200 []`. Contrato que no depende de que hoy la creación registre el nacimiento.
* **Errores posibles**: base no disponible (`503`).
* **¿Necesita transacción?**: no. Lectura simple.
* **Mapeo**: `mapHistoryRow(row)`.
