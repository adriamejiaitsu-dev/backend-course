# Refactor log — Clase 08

Registro del refactor seguro. Un cambio pequeño por fila, SIEMPRE con las
pruebas como red. Regla: si cambió la ruta, el status, el body o el permiso,
no fue solamente un refactor.

## Antes de empezar

* Prueba(s) que protegen la operación:
  - `test/requests-history.test.js` — 6 pruebas que fijan el contrato de
    `GET /:id/history` de la clase 6: 401 sin token, 200 con eventos en
    orden, 404 idéntico para una solicitud ajena y para una inexistente,
    agente puede leer cualquiera, 200 con arreglo vacío, y que el
    historial nunca exponga datos sensibles.
  - `test/traceability.test.js` — prueba que el `requestId` del cuerpo de
    error coincide con el del header, que también aplica a esta ruta.
* Resultado de la suite ANTES del refactor: **39 pass · 0 fail · 13 todo**
  (los 13 `todo` son los stubs de FEATURE-801, los míos).
* Commit de partida: `3b1132a` (`class-08-baseline`)

## Pasos

| # | Qué extraje / moví | ¿A dónde? | Suite después (pass/fail) |
| --- | --- | --- | --- |
| 1 | La validación del `:id` escrita a mano en la ruta | Se reutilizó `parseIdParam` de `src/http/parse-id.js` (ya existía, idéntico) | 39 pass · 0 fail |
| 2 | Las dos consultas SQL y el import de `pool` | A `requests.store.js`, usando `findById` y `findHistory` (ya existían, con la misma lista de columnas y el mismo `ORDER BY created_at, id`) | 39 pass · 0 fail |
| 3 | La regla de visibilidad reescrita a mano | A `request.policy.js` → `canViewHistory`, que ya existía y no se usaba. El 404 "ajena ≡ inexistente" se conserva igual | 39 pass · 0 fail |
| 4 | El mapeo de eventos por tipo | A `request.mapper.js` → `mapHistoryEventRow`, que ya existía y no se usaba | 39 pass · 0 fail |
| 5 | La coordinación de los dos lecturas | A `requests.service.js` → nueva función `listRequestHistory(actor, id)` | 39 pass · 0 fail |

Los 5 pasos se aplicaron **sin cambiar una sola aserción** de
`requests-history.test.js`. Ese archivo no se tocó: es la prueba que
certifica que el comportamiento no se movió.

## Verificación final

* Diff revisado: ¿algún cambio observable accidental? **No.**
  El diff del refactor es de 2 archivos (`requests.routes.js` y
  `requests.service.js`): 33 líneas agregadas, 75 eliminadas. Ninguna ruta
  cambia, ningún status cambia, ningún body cambia, ningún permiso cambia.
  La ruta pasó de 60 líneas a 4. Lo comprobaron las 6 pruebas de
  `requests-history.test.js` sin modificarlas, más el validador (check 01
  "Previous behavior preserved", PASS).
* Suite completa en verde: **sí — 39 pass · 0 fail · 13 todo**, idéntica
  al baseline. Mismo número de pruebas, mismos resultados: la evidencia de
  que no hubo cambio observable.
* Commit del refactor: `class-08-refactor` — `87bbe3a`

## Qué preguntaste a la IA (y qué verificaste)

* *"¿Este handler mezcla responsabilidades? Lista los bloques y sus
  razones de cambio."* — Útil como inventario. **Verificado** cotejando
  cada bloque contra el archivo, no aceptando la lista tal cual: la IA no
  mencionó que `parseIdParam`, `findById`, `findHistory`,
  `mapHistoryEventRow` y `canViewHistory` YA existían en el proyecto. Ese
  dato —el que de verdad ahorra trabajo— salió de `grep`, no de la IA.
* *"¿El refactor cambia el contrato?"* — **Verificado** con la prueba:
  corrí la suite después de cada paso. Si un paso hubiera movido un status
  o un body, las pruebas de `requests-history.test.js` lo habrían marcado
  en rojo. No lo hicieron en ninguno de los 5 pasos.
* *"¿Cómo traduzco las 3 razones de la policy a códigos HTTP?"* — Sugirió
  devolver un booleano. **Descartado**: con un booleano se pierde la razón
  y el service no puede elegir entre 403 y 409. Se usó
  `{ allowed, reason }`.

## Qué propuesta de la IA descartaste por sobrearquitectura

* **Un `request-history.service.js` separado**, o un subdirectorio
  `history/` con sus   propios archivos. La razón: la historia no tiene reglas
  propias — solo dos lecturas y la misma visibilidad que el resto del
  módulo. Un service por endpoint habría creado una frontera que no
  existe en el dominio.
* **Un `repositories/` genérico** con una clase base `Repository` para
  unificar store y users.store. No hay problema que resuelva: el store ya
  son funciones sueltas que reciben `db`, que es justo lo que necesita la
  transacción. La abstracción solo agregaría una capa de indirección.
* **Mapper separado por evento** (`mapStatusChanged`, `mapPriorityChanged`,
  `mapRequestClaimed`). Tres funciones de tres líneas para reemplazar un
  `if` de dos ramas dentro de `mapHistoryEventRow`.
* **Inyección de dependencias en el service** para poder hacer mocking en
  las pruebas. No hizo falta: la policy ya es una función pura importable
  directamente, que es la forma más simple de testearla.

El criterio que apliqué: una separación se queda solo si existe un problema
PRESENTE que resuelva. Las cinco piezas que sí quedaron (route, service,
store, policy, mapper) corresponden a razones de cambio reales y distintas,
las seis listadas en el mapa de responsabilidades.
