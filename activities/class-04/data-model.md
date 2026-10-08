# Data model — Request API v4

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> El esquema expresa decisiones sobre los datos, no solo su forma: cada NOT NULL,
> DEFAULT y CHECK debe poder defenderse.

## Tabla `requests`

| Columna | Tipo | ¿Nulo? | Default | Restricciones | ¿Quién lo genera? |
| ------- | ---- | ------ | ------- | ------------- | ------------------ |
| `id` | `BIGINT` | NO | — | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | La base. El código nunca lo envía: si lo intenta, PostgreSQL lo rechaza. |
| `title` | `VARCHAR(200)` | NO | — | `NOT NULL` | El cliente. Es lo único exigido desde la clase 2; ahora la invariante es inviolable aunque el código tenga un bug. |
| `description` | `TEXT` | SÍ | `NULL` | — | El cliente. `NULL` significa "no hay descripción"; cadena vacía significa "se escribió y quedó vacía" — decisiones distintas. |
| `priority` | `VARCHAR(20)` | NO | `'medium'` | `CHECK (priority IN ('low','medium','high'))` | El cliente o el `DEFAULT`. El conjunto cerrado vive junto a los datos. |
| `status` | `VARCHAR(30)` | NO | `'open'` | `CHECK (status IN ('open','in_progress','resolved','closed','cancelled'))` | La aplicación, según la máquina de estados. El `DEFAULT 'open'` documenta el estado inicial. |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | — | La base, en el instante del `INSERT`. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | — | La base al nacer; la aplicación en cada `UPDATE` (sin triggers, decisión documentada abajo). |

Justificaciones cortas:

* **`GENERATED ALWAYS AS IDENTITY`** y no `SERIAL` ni contador en memoria: la base
  genera *y rechaza* ids enviados; el contador de la clase 3 se reiniciaba con el proceso.
* **`TIMESTAMPTZ`** y no `TIMESTAMP`: guarda el instante absoluto; sin zona no se sabe qué
  reloj lo midió. El contrato HTTP sigue mostrando el formato ISO 8601 de siempre.
* **`VARCHAR(200)` para `title`**: límite simbólico heredado del formulario; se discute en
  *Dudas*. Lo indefendible no es el número, es no haberlo pensado.

## Tabla `request_status_history`

| Columna | Tipo | ¿Nulo? | Default | Restricciones | Notas |
| ------- | ---- | ------ | ------- | ------------- | ----- |
| `id` | `BIGINT` | NO | — | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | El hecho tiene identidad propia. |
| `request_id` | `BIGINT` | NO | — | `FOREIGN KEY → requests(id)` | Una fila de historia no puede apuntar a una solicitud inexistente. |
| `previous_status` | `VARCHAR(30)` | SÍ | `NULL` | `CHECK (previous_status IS NULL OR previous_status IN (…))` | **`NULL` con significado**: el nacimiento no viene de ningún estado. |
| `new_status` | `VARCHAR(30)` | NO | — | `CHECK (new_status IN (…))` | Estado al que se llegó. |
| `changed_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | — | Cuándo ocurrió el hecho, con zona horaria. |

¿Por qué `previous_status` admite NULL? Porque el primer evento de la vida de una solicitud
no tiene estado previo: el `NULL` representa ese "antes no existía". Es un `NULL` con
regla de negocio escrita (y protegida por el `CHECK` que admite `NULL` o valor válido),
no un hueco por descuido.

## Relaciones

`requests` 1 → * `request_status_history` por `request_id`.

* Una solicitud puede tener muchos eventos; cada evento pertenece a exactamente una
  solicitud.
* La FK **prohíbe**: historial huérfano (borrar una solicitud dejaría historia colgando —
  y de hecho no hay `DELETE`, decisión 001) y apuntar a ids inexistentes.
* No hay `ON DELETE CASCADE` a propósito: nada debe borrar historia en silencio.

## Reglas protegidas por la base

* `title` nunca puede ser `NULL` ni vacío por omisión del código (`NOT NULL`).
* `priority` solo puede ser `low|medium|high` (`CHECK`) — aunque el SQL venga de un
  Editor manual.
* `status` solo puede ser uno de los cinco estados (`CHECK`) — un estado inventado no se
  escribe ni siquiera desde el SQL Editor.
* `id` es único y lo genera la base (`PRIMARY KEY` + `IDENTITY`): la unicidad no depende
  del proceso.
* El historial apunta solo a solicitudes existentes (`FOREIGN KEY`).
* `previous_status` y `new_status` del historial usan el mismo conjunto cerrado (`CHECK`).

## Reglas que sigue protegiendo la aplicación

* **Transiciones permitidas** (`open → in_progress → …`): un `CHECK` ve el valor nuevo,
  no compara contra el anterior; la máquina de estados vive en `request-status.js`.
* **Estados terminales** (`closed`, `cancelled` no se mueven): misma razón.
* **Estado inicial `open` al crear**: la base *podría* con un `DEFAULT`, y lo tiene como
  respaldo, pero la intención la pone la aplicación al crear.
* **`updated_at` en cada cambio**: la base solo pone el del `INSERT`; moverlo en el
  `UPDATE` queda en la aplicación para que la responsabilidad sea explícita (sin triggers).
* **Formato del contrato** (camelCase, errores `{code,message}`): es un acuerdo HTTP, la
  base no lo conoce.

Esta división no es universal — hay equipos que ponen más reglas en la base (triggers,
constraints compuestas). La nuestra es una decisión documentada: la base guarda
integridad estructural, la aplicación comprende el proceso.

## Dudas

* **`VARCHAR(200)` vs `TEXT`**: si un título largo es un error de UX o un caso legítimo.
  Hoy el `200` no se valida en la aplicación, así que un título de 250 caracteres llegaría
  como `22001` (string_data_right_truncation) — ver *error-map*, categoría Persistencia.
* **`updated_at` sin trigger**: dos escrituras concurrentes podrían pisarlo; aquí no hay
  concurrencia resuelta (problema nombrado en el cierre de la clase, no resuelto).
* **Quién escribe historia al crear**: la creación registra el nacimiento
  (`NULL → open`) dentro de la misma unidad; si en el futuro alguien inserta por SQL
  directo, no habrá historia y el contrato lo tolera (`200 []`).
* **Retención de historia**: ¿se archiva o crece sin límite? No lo decide este esquema.
