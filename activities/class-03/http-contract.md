# HTTP contract — Request API v3

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Para cada endpoint: intención, path, query, body, respuesta exitosa, errores y un ejemplo.
> El ejemplo obliga a decidir los detalles que la tabla esconde.

## Formato de error (común a toda la API)

Todo cuerpo de error tiene esta forma; el `code` es para los programas (un `if` sobre
`error.code` es robusto, un `if` sobre el texto no) y el `message` es para las personas:

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot move a request from \"open\" to \"closed\""
  }
}
```

Códigos existentes:

| Código                          | HTTP | Cuándo                                                     |
| ------------------------------- | ---: | ---------------------------------------------------------- |
| `TITLE_REQUIRED`                |  400 | `title` ausente o solo espacios al crear.                  |
| `INVALID_PRIORITY_VALUE`        |  400 | `priority` fuera de `low`/`medium`/`high`.                 |
| `INVALID_DESCRIPTION_VALUE`     |  400 | `description` presente pero no es texto.                   |
| `EMPTY_PATCH_BODY`              |  400 | `PATCH` sin campos modificables.                           |
| `INVALID_STATUS_VALUE`          |  400 | `status` en el body fuera de la lista cerrada.             |
| `INVALID_FILTER_VALUE`          |  400 | Filtro `status` o `priority` con valor desconocido.        |
| `REQUEST_NOT_FOUND`             |  404 | El `id` no corresponde a ninguna solicitud.                |
| `INVALID_STATUS_TRANSITION`     |  409 | El movimiento de estado no está en el mapa de transiciones.|
| `REQUEST_IN_TERMINAL_STATUS`    |  409 | La solicitud está `closed` o `cancelled`.                  |

---

## `GET /requests`

* **Intención**: listar la colección de solicitudes, opcionalmente filtrada.
* **Path**: `/requests`
* **Query**: `status` (`open` | `in_progress` | `resolved` | `closed` | `cancelled`) y
  `priority` (`low` | `medium` | `high`); se pueden combinar y ambas son opcionales.
* **Body**: ninguno.
* **Respuesta exitosa**: `200` con un arreglo JSON (nunca `404` por vacío: "¿cuáles?" siempre
  tiene respuesta). Sin coincidencias → `200` con `[]`. Sin filtros → toda la colección.
* **Errores**: `400 INVALID_FILTER_VALUE` si un filtro trae un valor fuera de su conjunto.

**Ejemplo**

```http
GET /requests?status=open&priority=high HTTP/1.1
Host: localhost:3000

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "title": "Projector does not turn on",
    "description": "The projector in room 204 shows no image during class.",
    "status": "open",
    "priority": "high",
    "createdAt": "2026-10-06T14:00:00.000Z",
    "updatedAt": "2026-10-06T14:00:00.000Z"
  }
]
```

---

## `GET /requests/:id`

* **Intención**: consultar una solicitud concreta.
* **Path**: `/requests/:id` (llega como texto, se convierte a número).
* **Respuesta exitosa**: `200` con el objeto completo.
* **Errores**: `404 REQUEST_NOT_FOUND` si el id no existe. Un id no numérico también es `404`:
  no hay recurso con esa forma.

**Ejemplo**

```http
GET /requests/1 HTTP/1.1
Host: localhost:3000

HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "title": "Projector does not turn on",
  "description": "The projector in room 204 shows no image during class.",
  "status": "open",
  "priority": "high",
  "createdAt": "2026-10-06T14:00:00.000Z",
  "updatedAt": "2026-10-06T14:00:00.000Z"
}
```

```http
GET /requests/999 HTTP/1.1
Host: localhost:3000

HTTP/1.1 404 Not Found
Content-Type: application/json

{ "error": { "code": "REQUEST_NOT_FOUND", "message": "Request 999 not found" } }
```

---

## `POST /requests`

* **Intención**: crear una solicitud.
* **Path**: `/requests`
* **Body**: `title` (requerido, texto no vacío), `description` (opcional, texto) y `priority`
  (opcional, `low` | `medium` | `high`, por defecto `medium`). Lo que el servidor controla
  (`id`, `status`, `createdAt`, `updatedAt`) se **ignora** si llega, igual que los campos no
  reconocidos.
* **Respuesta exitosa**: `201` con el objeto creado, ya con `id`, `status: "open"` y las dos
  fechas.
* **Errores**: `400 TITLE_REQUIRED`, `400 INVALID_PRIORITY_VALUE`,
  `400 INVALID_DESCRIPTION_VALUE`. Ningún dato se guarda si la petición falla.

**Ejemplo**

```http
POST /requests HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "title": "Air conditioning is noisy",
  "description": "Room 110 makes noise all morning.",
  "priority": "low",
  "status": "closed"
}

HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 4,
  "title": "Air conditioning is noisy",
  "description": "Room 110 makes noise all morning.",
  "status": "open",
  "priority": "low",
  "createdAt": "2026-10-06T14:12:03.415Z",
  "updatedAt": "2026-10-06T14:12:03.415Z"
}
```

```http
POST /requests HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{ "description": "No title here" }

HTTP/1.1 400 Bad Request
Content-Type: application/json

{ "error": { "code": "TITLE_REQUIRED", "message": "Title is required" } }
```

---

## `PATCH /requests/:id`

* **Intención**: actualizar en parcial una solicitud, incluida su transición de estado.
* **Path**: `/requests/:id`
* **Body**: campos modificables `title`, `description`, `priority`, `status` (al menos uno
  presente). Campos del servidor ignorados: `id`, `createdAt`, `updatedAt` (y `status` cuando
  la solicitud está en un estado terminal).
* **Respuesta exitosa**: `200` con la solicitud actualizada y `updatedAt` nuevo.
* **Errores**: la tabla completa.

| Situación                                                | Estado | Código de error                   |
| -------------------------------------------------------- | -----: | --------------------------------- |
| Id no numérico o inexistente                             |   404  | `REQUEST_NOT_FOUND`               |
| Body sin campos modificables (o no JSON)                 |   400  | `EMPTY_PATCH_BODY`                |
| `priority` fuera de su conjunto                          |   400  | `INVALID_PRIORITY_VALUE`          |
| `title` presente pero vacío                              |   400  | `TITLE_REQUIRED`                  |
| `status` fuera de la lista cerrada                       |   400  | `INVALID_STATUS_VALUE`            |
| Solicitud `closed` o `cancelled` (cualquier modificación)|   409  | `REQUEST_IN_TERMINAL_STATUS`      |
| `status` presente y el movimiento no está permitido      |   409  | `INVALID_STATUS_TRANSITION`       |

El orden importa: primero la forma (`400`), luego el recurso (`404`) y al final la regla de
negocio (`409`). Un body mal formado ni siquiera llega a mirar el estado.

**Ejemplo (éxito y ejemplo de 409)**

```http
PATCH /requests/1 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{ "status": "closed" }

HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot move a request from \"open\" to \"closed\""
  }
}
```

```http
PATCH /requests/1 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{ "priority": "medium" }

HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "title": "Projector does not turn on",
  "description": "The projector in room 204 shows no image during class.",
  "status": "open",
  "priority": "medium",
  "createdAt": "2026-10-06T14:00:00.000Z",
  "updatedAt": "2026-10-06T14:20:44.107Z"
}
```

---

## Reglas transversales

1. Todas las respuestas llevan `Content-Type: application/json` (lo hace `res.json()`).
2. Una ruta que no existe en esta API responde `404` con el formato de error estándar
   (`ROUTE_NOT_FOUND`), no con texto plano.
3. Los datos viven en memoria: al reiniciar, la colección vuelve a su estado inicial y el
   contador de ids vuelve a empezar. Es comportamiento esperado y documentado, no un defecto.
4. No hay `DELETE`, no hay base de datos, no hay autenticación: las exclusiones de la
   entrega se mantienen.
