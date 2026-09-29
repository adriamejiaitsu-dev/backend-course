# Responsibility map — Clase 08

Mapa de responsabilidades del handler cargado ANTES de refactorizar.
Complétalo mientras lees `GET /:id/history` en `requests.routes.js`.

## El handler analizado

Ruta/operación: `GET /requests/:id/history`

Bloque original: 60 líneas en un solo `router.get`, con 6 bloques separables.

## Clasificación de bloques

Para cada bloque del handler, anota a qué categoría pertenece y qué líneas
lo forman (aprox.):

| Categoría | ¿Qué hace ese bloque aquí? | ¿A qué archivo debería moverse? |
| --- | --- | --- |
| HTTP (leer params/identidad) | Valida `req.params.id` a mano con un regex propio (`/^[1-9][0-9]{0,17}$/`) y lo convierte a número. Es la MISMA validación que ya vivía en `src/http/parse-id.js`. | `src/http/parse-id.js` (ya existía; se reutilizó `parseIdParam`) |
| Aplicación (coordinar el caso) | Nada: no coordina, ejecuta. Encadena directamente SELECT → decisión → SELECT → mapeo. Esa secuencia ES el caso de uso. | `requests.service.js` → nueva función `listRequestHistory(actor, id)` |
| Negocio (¿puede verse?) | Reescribe la regla de visibilidad a mano: `isAgent = req.auth.role === 'agent'`, `isOwner = created_by === req.auth.userId`. Duplica `canViewRequest` y su versión de historial `canViewHistory`, que ya existían sin usarse. Además traduce el 404 "misma respuesta para ajena que para inexistente" a mano. | `request.policy.js` → `canViewHistory` (ya existía, ahora sí se usa) |
| Persistencia (SQL) | Dos `pool.query` completos: uno con la lista de columnas de `requests` escrita a mano (idéntica a `REQUEST_COLUMNS` del store) y otro con la de `request_history`. Importa `pool` directo en la ruta. | `requests.store.js` → `findById` y `findHistory` (ambos ya existían) |
| Presentación (construir respuesta) | Mapea cada fila a mano con un `if (row.type === 'priority_changed')`. Es una copia character por character de `mapHistoryEventRow`, que ya existía en `request.mapper.js`. | `request.mapper.js` → `mapHistoryEventRow` (ya existía, ahora sí se usa) |
| Observabilidad (errores/requestId) | Lanza `AppError` desde la ruta con la categoría correcta ('resource' / 'contract'). Correcto en la forma, pero en el lugar equivocado: el handler mezcla reglas con traducción de errores. | La construcción del `AppError` queda en `requests.service.js` (el `notFound` ya existente); el `requestId` sigue siendo responsabilidad del middleware de clase 7 |

## Las preguntas del análisis

* ¿Cuántas RAZONES distintas tiene esta función para cambiar?

  Seis, y todas independientes entre sí:

  1. Cambió el formato del `:id` que acepta la API (HTTP).
  2. Cambió la regla de quién ve un historial (negocio).
  3. Cambió una columna o una tabla (persistencia).
  4. Cambió la forma de representar un evento (presentación).
  5. Cambió la traducción de un error a status (observabilidad).
  6. Cambió el orden de los pasos del caso de uso (aplicación).

  Cada una toca el mismo `router.get`. Un ticket de una sola línea —
  "agregar `assignedTo` al historial" — obligaba a editar un archivo que no
  tiene nada que ver con la asignación.

* ¿Qué piezas ya existentes del proyecto duplica? (pista: mira store, mapper y policy)

  Tres, y las tres ya estaban escritas y sin usar:

  - `parseIdParam` (`src/http/parse-id.js`) — el regex del `:id` estaba
    copiado literalmente en la ruta.
  - `findById` / `findHistory` (`requests.store.js`) — las dos consultas
    estaban copiadas, incluida la lista de columnas `REQUEST_COLUMNS`.
  - `mapHistoryEventRow` (`request.mapper.js`) — el mapeo por tipo de evento
    estaba copiado, incluido el `if` de `priority_changed`.
  - `canViewHistory` (`request.policy.js`) — la regla de visibilidad ya
    existía escrita como función; la ruta la reimplementó.

* ¿Qué NO se puede probar de forma aislada mientras todo viva junto?

  Casi nada. `canViewHistory` existe como función pura pero su única
  pregunteable está atrapada detrás de una ruta: para ejercitar
  "un agente puede ver cualquier historial" hay que levantar HTTP,
  autenticarse, crear un usuario y una solicitud, y recién ahí observar el
  resultado. La regla de negocio no se puede probar en milisegundos, sin
  base de datos y sin servidor — que es exactamente el costo que la clase
  paga cuando la feature nueva (FEATURE-801) necesita la misma regla con
  tres respuestas distintas (403/409/409).
