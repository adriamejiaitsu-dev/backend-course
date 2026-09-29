# Class 08 evidence — para el checkpoint de la PRÓXIMA clase

El tema 8 NO se evalúa hoy: primero se aprende y se practica. Al comenzar
la próxima clase ejecutarás un checkpoint breve SOLO del tema 8. Este
archivo reúne desde ya la evidencia que ese checkpoint pedirá.

## Evidencia mínima del tema 8

* Baseline anterior al refactor (commit `class-08-baseline`): **`3b1132a`**
* Commits separados de refactor y feature (`class-08-refactor`,
  `class-08-feature`): **`87bbe3a`** y **`f13a6c5`**
* `responsibility-map.md` completo: **sí** — los 6 bloques del handler
  clasificados, con su archivo destino, y las 6 razones de cambio.
* Separación route/service/store/policy:
  - **route** (`requests.routes.js`): lee el `:id` con `parseIdParam`, pasa
    `req.auth`, llama al service y responde. 4 líneas por endpoint. Sin
    `pool`, sin SQL, sin `AppError`.
  - **service** (`requests.service.js`): `listRequestHistory` coordina las
    dos lecturas y traduce "ajena ≡ inexistente" a `notFound`;
    `claimRequest` deriva la identidad, evalúa la policy, decide el status
    y abre la transacción. No importa Express.
  - **store** (`requests.store.js`): todo el SQL. `findById`, `findHistory`,
    `claimRequest` (un solo `UPDATE` que asigna, cambia status y refresca
    `updated_at`), `insertHistoryEvent`.
  - **policy** (`request.policy.js`): `canViewHistory` (antes escrito y sin
    usar) y `canClaimRequest`, pura, sin SQL ni HTTP.
  - **mapper** (`request.mapper.js`): `mapHistoryEventRow` (antes escrito y
    sin usar) y `mapRequestRow` con `assignedTo`.
* Migración de assignment aplicada (005): **`npm run db:migrate` →
  `[APPLIED] 005_add_request_assignment.sql`**. La 005 ya venía en el
  starter; se aplicó y se dejó intacta, igual que 001-004.
* Endpoint claim funcionando: `POST /requests/:id/claim` responde `200` con
  `{ id, title, status: "in_progress", assignedTo, updatedAt }`, donde
  `assignedTo` es el id del agente autenticado. Demostrado por 11 pruebas de
  `test/requests-claim.test.js` y por los checks 03-10 del validador.
* Historial y transacción consistentes: el claim escribe **una sola
  unidad de trabajo** — el `UPDATE` de asignación y el evento
  `request_claimed` (`open → in_progress`) van en la misma transacción con
  el mismo client. Si el insert del historial fallara, el `ROLLBACK`
  deshace también la asignación: nunca queda una solicitud asignada sin
  su evento, ni un evento sin su asignación.
* Pruebas de policy (sin HTTP) y de API:
  - `test/request-policy.test.js` — **7 pruebas** con objetos planos, sin
    base de datos y sin servidor. Cubren la matriz completa de la regla.
  - `test/requests-claim.test.js` — **11 pruebas** por HTTP.
  - Suite completa: **57 pass · 0 fail · 0 todo** (los 13 `todo` del
    starter quedaron implementados).
* Resultado del validador: **`FINAL RESULT: PASSED` (12/12)**.
  Evidencia completa en `activities/class-08/validation-evidence.txt`
  (salida real, sin secretos).

## Explicación integradora (bórrala de memoria: escríbela con el proyecto abierto)

> Explica qué parte de tu trabajo fue refactor y cuál fue nueva
> funcionalidad. Ubica una regla en policy, una coordinación en service,
> una operación SQL en store y explica cómo las pruebas demostraron que el
> comportamiento anterior se conservó.

Lo que hice en el commit `class-08-refactor` fue REFACTOR: moví
responsabilidades que ya existían a los archivos que ya las tenían
esperando, sin escribir comportamiento nuevo. `GET /:id/history` bajó de
60 líneas a 4 en la ruta. Reutilicé `parseIdParam`, `findById`,
`findHistory`, `mapHistoryEventRow` y `canViewHistory`: cinco funciones que
ya estaban escritas en el proyecto y que nadie estaba usando, porque el
handler las había copiado a mano. La prueba de que no cambié el
comportamiento es que `test/requests-history.test.js` NO se tocó: las mismas
6 aserciones que fijaban el contrato de la clase 6 pasaron sin una sola
edición, y la suite dio exactamente los mismos 39 pass / 0 fail que antes de
empezar.

Lo que hice en `class-08-feature` fue FUNCIONALIDAD NUEVA: la ruta no
existe, la columna `assigned_to` es nueva, y hay reglas que antes no
existían. La regla de "quién puede reclamar" vive en `request.policy.js`
como `canClaimRequest`, que es una función pura sobre `{ actor, request }`:
no abre conexiones, no conoce Express y por eso sus 7 pruebas corren en
milisegundos sin base de datos. Devuelve `{ allowed, reason }` y no un
booleano porque hay tres razones de rechazo y cada una significa una cosa
distinta sobre el HTTP: `NOT_AGENT` → 403, `ALREADY_ASSIGNED` → 409
`REQUEST_ALREADY_ASSIGNED`, `NOT_OPEN` → 409 `REQUEST_NOT_OPEN`.

La coordinación vive en `requests.service.js` con `claimRequest`: deriva la
identidad de `req.auth.userId` — nunca del body — rechaza `assignedTo` con
400 `SERVER_CONTROLLED_FIELD` si alguien lo manda, busca la solicitud,
pregunta a la policy, y recién ahí escribe. La operación SQL vive en
`requests.store.js` con `claimRequest`: un único `UPDATE` que pone
`assigned_to`, mueve el estado a `in_progress` y refresca `updated_at`.
Es una sola sentencia a propósito: si la asignación y el cambio de estado
fueran dos `UPDATE` separados, existiría un instante —quizás un crash, un
timeout— en el que la fila dijera "el agente X es responsable" mientras el
estado todavía decía `open`.

Por eso la asignación y el historial van en la misma transacción: se llaman
dentro de `withTransaction` con el mismo `client`, así que el evento
`request_claimed` (`open → in_progress`) y la asignación son una sola unidad
de trabajo. Si el insert del historial falla, el `ROLLBACK` deshace las dos
cosas. Esa es la diferencia entre "actualizamos dos columnas" y "ejecutamos
una acción con significado": el claim expresa una intención, deriva la
identidad del servidor, aplica varias reglas y deja rastro.

Lo que demuestra que no rompí lo anterior son tres cosas independientes:
las 6 pruebas de `requests-history.test.js` sin modificar, la suite completa
en 57/57 con los 13 `todo` del starter implementados, y el check 01 del
validador ("Previous behavior preserved") que vuelve a comprobar por HTTP
que el listado, el 404 de recurso ajeno, el 400 de id inválido, la
transición de estado por agente y el historial siguen respondiendo
exactamente lo mismo que en la clase 7.
