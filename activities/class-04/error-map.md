# Error map — Entrega 04

> Fase 1 · clasifica cada situación por categoría y define la respuesta externa.
> Regla transversal: la respuesta al cliente jamás incluye contraseñas, hosts,
> sentencias SQL, stack traces ni errores crudos de PostgreSQL.

## Categorías

| Categoría | Significado | Estado HTTP |
| --------- | ----------- | ----------- |
| Contrato | La petición está mal en sí misma (forma, campos, valores) | `400` |
| Recurso | El recurso referido no existe | `404` |
| Dominio | Petición válida que el estado actual prohíbe | `409` |
| Persistencia | La base rechazó algo que la app creía válido (p. ej. `title` demasiado largo) | `400` (reinterpretado, sin código crudo) |
| Infraestructura | La base no está disponible (pausada, sin red, pool agotado) | `503` |
| Interno | Error inesperado no identificado | `500` |

Todas responden `{ "error": { "code", "message" } }` — el formato de la clase 3 no cambia.

## Situaciones concretas

| Situación | Categoría | Estado | Código de error |
| --------- | --------- | ------ | --------------- |
| Falta `title` al crear | Contrato | `400` | `TITLE_REQUIRED` |
| Prioridad desconocida | Contrato | `400` | `INVALID_PRIORITY_VALUE` |
| Filtro con valor desconocido | Contrato | `400` | `INVALID_FILTER_VALUE` |
| `:id` no numérico en la URL | Contrato | `404` | `REQUEST_NOT_FOUND`
| `PATCH` sin campos modificables | Contrato | `400` | `EMPTY_PATCH_BODY` |
| Solicitud inexistente | Recurso | `404` | `REQUEST_NOT_FOUND` |
| Ruta desconocida | Recurso | `404` | `ROUTE_NOT_FOUND` |
| Transición inválida | Dominio | `409` | `INVALID_STATUS_TRANSITION` |
| Solicitud terminal | Dominio | `409` | `REQUEST_IN_TERMINAL_STATUS` |
| Restricción `CHECK` rechaza un `INSERT` (`23514`) | Persistencia | `400` | `CONSTRAINT_VIOLATION` (mensaje genérico: nunca el detalle de pg) |
| `title` más largo que 200 caracteres (`22001`) | Persistencia | `400` | `TITLE_TOO_LONG` |
| `NOT NULL` violado (`23502`) | Persistencia | `400` | `CONSTRAINT_VIOLATION` |
| Base pausada / sin red / DNS (`ECONNREFUSED`, `CONNECT_TIMEOUT`, `57P01`) | Infraestructura | `503` | `DATABASE_UNAVAILABLE` |
| Error de pg no identificado | Interno | `500` | `INTERNAL_ERROR` |

Notas de decisión:

* **`id` no numérico**: en la clase 3 eso producía un `404` porque la búsqueda en memoria
  simplemente no lo encontraba. El contrato v3 se mantiene intacto: la ruta responde `404
  REQUEST_NOT_FOUND` sin consultar ("no hay recurso con esa forma"). Con SQL, `WHERE id =
  'abc'` lanzaría `22P02` (`invalid_text_representation`); para que eso jamás ocurra por
  accidente, `database/pool.js` traduce `22P02` a `400 INVALID_REQUEST_ID` como **red de
  seguridad interna** (código que el cliente no debería ver por la ruta normal).
* **La base no distingue "desconocido" de "prohibido"**: por eso los `409` siguen
  decidiéndolos la máquina de estados en la aplicación, y la base solo sería el respaldo
  si un valor escapara al `CHECK`.
* **`503` vs `500`**: si la base no está disponible es infraestructura, no bug nuestro;
  el cliente puede reintentar. `500` es lo que no supimos clasificar.

## Qué se registra en el log interno

Se registra: método y ruta, id de la solicitud cuando existe, código de error devuelto,
categoría de pg (`code` de la excepción, p. ej. `23514`), y la hora. Eso basta para
diagnosticar sin volver a reproducir.

Prohibido registrar o devolver: la cadena `DATABASE_URL`, usuarios, contraseñas, hosts,
la sentencia SQL completa con valores, stack traces completos y cualquier token. La
respuesta al cliente solo lleva `code` + `message` genéricos; el detalle vive en el log
del servidor.
