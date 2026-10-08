# AI usage

> Regla de la entrega: la IA revisa DESPUÉS del diseño (`class-04-design`) y no puede
> cambiar en silencio tablas, columnas, tipos, restricciones, rutas, estados, transiciones,
> códigos, estructura ni la decisión del historial. No se exigen conversaciones completas.

## My design before using AI

Declaración honesta: **este diseño se produjo con asistencia de IA desde el primer
documento**, igual que en la entrega 03. El tag `class-04-design` protege el orden en el
historial (el diseño se commiteó primero y está intacto en `f6fd072`), no un trabajo
redactado sin IA. Lo decidido en esa fase, tal como quedó en los seis documentos:

* Tablas `requests` (id `IDENTITY`, `title NOT NULL`, conjuntos cerrados con `CHECK`) y
  `request_status_history` (`previous_status` nullable con significado "no existía",
  `new_status NOT NULL`, `FOREIGN KEY` sin `ON DELETE CASCADE`).
* Solo 5 estados y el mapa de transiciones de la clase 3; terminales prohibidos; no hay
  `DELETE` (decisión 001).
* La creación escribe la solicitud **y** su nacimiento en la misma transacción; un cambio
  de estado escribe el `UPDATE` **y** su evento en la misma transacción.
* Cinco endpoints (los cuatro de la clase 3 + `GET /requests/:id/history`).
* El historial como responsabilidad nueva y obligatoria (decisión a documentar en 002).
* Contrato intacto de la clase 03, incluido `404` para id no numérico.

## What I asked the AI

* Traducir el diseño a migraciones y a un `store` asíncrono con SQL parametrizado.
* Construir `pool.js`, `transaction.js` y el `mapper` fila → representación.
* Cierre del ciclo: error middleware que devuelva `503` y nunca filtre el mensaje de pg.
* Plan de ejecución de la matriz en fase 6 y del runner local de migraciones (sin `psql`).
* Qué documentar en la decisión 002 y cómo formular las 12 respuestas del cierre.

## What the AI proposed

* El esquema 001/002 tal como quedó (coincidía con el diseño; solo detalles de forma).
* Parametrizar **todo** el SQL de `requests.store.js`, incluidos los filtros dinámicos.
* `GENERATED ALWAYS AS IDENTITY` y `BIGINT`: advertir que pg devuelve id como string y que
  el mapper debe convertirlo a número para no romper el contrato.
* Traducción centralizada de SQLSTATE (22001 → `TITLE_TOO_LONG`, 23514/23502 → 400, clases
  08x/57x y errno de OS → `503 DATABASE_UNAVAILABLE`).
* La prueba del `503` con URL rota en un proceso aparte, y el rollback demostrado a nivel
  SQL con el mismo flujo que el store (UPDATE + INSERT) para no tocar el esquema.

## What I accepted

* La separación ruta / service / store / mapper tal como quedó en `src/modules/requests/`.
* `INSERT` de historia junto al `INSERT`/`UPDATE` en la misma transacción (unidad de
  creación y de transición). Beneficio: nunca hay un estado sin su explicación. Costo
  reconocido: toda escritura de estado pasa por el mismo proceso.
* `updated_at = NOW()` como responsabilidad de la aplicación (sin triggers).
* Confirmación de que `previous_status NULL` solo admite el nacimiento, por el `CHECK`.
* Beneficio detectado al aceptar la traducción central de errores: en el caso C19 la
  primera versión de `translate()` dejaba escapar el `host` de la URL en el mensaje; se
  corrigió clasificando los errno de OS y limitando el paso a través a nuestros propios
  errores (los que llevan `status`).

## What I rejected or changed

* **`400 INVALID_REQUEST_ID` para id no numérico**: propuesto por la IA en `error-map.md` y
  `test-matrix.md` en la fase 1; se reemplazó por `404 REQUEST_NOT_FOUND` para conservar el
  contrato de la clase 3 intacto. El `translate()` dejó de mapear `22P02` a un código
  visible: quedó como red de seguridad interna.
* **ORM y `supabase-js`**: rechazados; el cliente de la base no viaja por HTTP.
* **Triggers para `updated_at` y plugin `ON DELETE CASCADE`**: rechazados (decisiones en
  `data-model.md` y `error-map.md`); sin `DELETE` no hay nada que borrar en cascada.
* **Contar filas de historial "a ciegas" en `db:check`**: el `db:check` inicial crasheaba
  si una tabla faltaba; se corrigió para reportar la ausencia antes de contar.
* **Plantilla del `README.md` del proyecto copiada de la clase 03**: reemplazada por la v4
  con el contrato real (history + 503).

## How I verified the result

* `npm run db:check` tras migraciones: conexión, dos tablas presentes, `db:check OK`.
* Matriz de 15 casos ejecutada el 08/10/2026 contra el servidor real; todas las
  observaciones son literales (HTTP + body): 201, 404, `[]`, 400/409, historia ordenada,
  e inyección SQL guardada como dato.
* Evidencias clave: persistencia tras reinicio (`GET /requests/5` con los mismos
  `createdAt`/`updatedAt` que el `201`) y rollback (`UPDATE` ejecutado → historia
  rechazada `23514` → `ROLLBACK` → `open` intacto, 0 eventos parciales).
* Caso infraestructura: servidor con URL rota responde `503 DATABASE_UNAVAILABLE` tres
  veces sin morir, y el `body` no repite el host.

## What I still do not understand

* **Concurrencia de la decisión**: hoy la transacción protege la escritura en dos tablas,
  pero la decisión de transición se toma sobre el estado leído; dos `PATCH` simultáneos
  podrían decidir sobre la misma foto. No está resuelto (queda nombrado en `reflection.md`)
  y no sabría defender aún si `SELECT ... FOR UPDATE` es la respuesta completa.
* **`VARCHAR(200)` vs `TEXT`** en el título: la frontera entre "dato inválido" (debería
  validarse en la app) y "error de base legítimo" (22001) no es algo que hoy distinga la
  API con elegancia; el error-map lo documenta, pero la decisión de diseño no está
  cerrada.
* **Retención de historia**: una tabla que crece sin límite; no sé aún qué política de
  archivo de eventos aplicar.