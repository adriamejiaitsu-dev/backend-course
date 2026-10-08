# Reflection — Entrega 04

> Fase 6 · doce preguntas del cierre de la clase 4, respondidas con **evidencia del
> propio repositorio**. No se cita la URL de conexión ni credenciales en ninguna.

1. **¿Qué diferencia hay entre memoria de proceso y persistencia?**

   El array de la clase 3 vivía dentro de `node`: al detener el proceso, el id nuevo
   desaparecía. La clase 4 guarda todo fuera del proceso, en PostgreSQL: la prueba
   reina es `test-matrix.md`, fila *Reiniciar servidor* — el `201` de la request 5 y el
   `GET /requests/5` posterior al reinicio muestran los **mismos** `createdAt`/`updatedAt`
   (`2026-10-08T13:45:18.164Z`). Persistir no es "exportar", es que el dato tiene una vida
   independiente del servidor que lo atiende.

2. **¿Qué papel cumple Supabase en esta clase?**

   Es el PostgreSQL remoto de la clase: una base real, con reglas, transacciones y
   concurrencia, a la que nuestra API se conecta por red. Sin Docker ni PostgreSQL local,
   cumple la exclusión de la entrega. En el trabajo concreto: recibió las migraciones
   001/002 y el `seed.sql` del repositorio (ejecutados desde los archivos de `database/`),
   guarda las filas de `requests` e `request_status_history`, y por eso sobrevive a los
   reinicios. `db:check` verifica conexión y esquema sin exponer la URL.

3. **¿Por qué `DATABASE_URL` no debe llegar al frontend?**

   Porque es la llave de toda la base: quién la tenga puede leer/escribir **todo** el
   esquema, no solo las solicitudes, saltándose las reglas de la aplicación. Por eso vive
   solo en `.env` (ignorado por git, verificado con `git check-ignore`), se copia en el
   SQL Editor y jamás se pega en un chat o un commit. Además, el frontend no la necesita:
   su único canal es el `href` HTTP de nuestra API, que nunca devuelve el SQLSTATE crudo
   ni la cadena (el corpo de error se traduce en `database/pool.js`).

4. **¿Para qué sirve un pool?**

   Abrir una conexión por petición es lento (handshake TCP + TLS + auth) y PostgreSQL
   limita cuántas existen. El `pool` de `src/database/pool.js` mantiene conexiones
   reutilizables: una petición toma una prestada y la devuelve. La evidencia es de
   composición: los 20 casos de la matriz corrieron sobre el pool compartido sin agotar
   la base, y el caso *Base no disponible* muestra que la falla se resuelve igual para
   todos los clientes del pool.

5. **¿Por qué utilizamos parámetros?**

   Porque el texto del cliente se envía como **dato**, nunca como **instrucción**. El
   caso *SQL injection* de la matriz lo demuestra en vivo: `title = "x'; DROP TABLE
   requests; --"` se guardó literal (`201`, id 7) y el `db:check` posterior confirma que
   `requests` sigue presente. Con concatenación, ese texto habría terminado siendo SQL.

6. **¿Qué diferencia hay entre una fila y una representación HTTP?**

   La fila conoce el idioma de la base (`created_at`, `previous_status`) y el HTTP conoce
   el del cliente iso 8601/camelCase (`createdAt`, `previousStatus`). Devolver la fila
   directa hubiera roto en silencio el contrato de la clase 3 (todo cliente leyendo
   `createdAt` recibiría `undefined`). El `request.mapper.js` es el único puente: una
   función pura por forma, concentrada en un lugar en lugar de repartida entre handlers.

7. **¿Qué protege la base y qué protege la aplicación?**

   La base (esquema, `data-model.md`, *reglas protegidas por la base*) garantiza
   integridad estructural: `id` único generado por `IDENTITY`, `NOT NULL` en `title`,
   conjuntos cerrados de `priority` y `status` con `CHECK`, la `FOREIGN KEY` del
   historial. La aplicación (máquina de estados `request-status.js` + service) protege lo
   que la base no puede comparar: **transiciones** (open→closed responde `409`, matriz
   fila *Transición inválida*), **estados terminales** y **formato del contrato**. La
   base es la segunda línea: si un valor prohibido escapara, el `23514` lo frenaría.

8. **¿Por qué guardamos el historial?**

   Porque el estado actual es una fotografía, pero el qué pasó —quién movió, desde qué
   estado— es la explicación. Cada `op → in_progress` deja una fila en
   `request_status_history` (matriz, fila *Transición válida*), y el *nacimiento*
   (`NULL → open`) queda registrado en el mismo `INSERT` de la creación. La decisión está
   documentada en `docs/decisions/002-preserve-status-history.md`: sin esto, una
   solicitud en `closed` solo respondería "qué es", nunca "cómo llegó".

9. **¿Qué inconsistencia evita la transacción?**

   Que queden a medias: un estado nuevo **sin** su evento de historia, o una solicitud
   creada **sin** su fila de nacimiento. El bloque *Rollback demostrado* de la matriz lo
   muestra con datos reales: el `UPDATE` de `requests` se ejecutó, la segunda escritura
   (el evento) fue rechazada por el `CHECK`, y el `ROLLBACK` dejó la request en `open` con
   cero eventos parciales. Las dos filas cambian juntas o no cambian.

10. **¿Por qué una transacción utiliza el mismo cliente?**

    Porque `BEGIN`/`COMMIT` y las sentencias deben hablar en la **misma** conversación:
    si la segunda escritura usara otra conexión del pool, el `BEGIN` no la cubriría y el
    `ROLLBACK` no la alcanzaría. `transaction.js` toma un cliente prestado, ejecuta todas
    sus escrituras con ese único `client`, hace `COMMIT` o `ROLLBACK` y lo devuelve en el
    `finally` (aunque algo falle, el pool no pierde la conexión).

11. **¿Qué ocurre con los datos al reiniciar Express?**

    Nada: siguen donde estaban. Es justo el salto de la clase 3 a la 4. La matriz
    *Reinicio de Express / Reiniciar servidor*: tras `Ctrl + C` + `npm start`, `GET
    /requests/5` devuelve los mismos datos e instantes. El proceso muere; los bytes de la
    base no.

12. **¿Qué problema aún no resolvimos?**

    La **concurrencia real**: dos peticiones que cambian la misma solicitud a la vez.
    Hoy la secuencia es leer → decidir → escribir, y entre la lectura de una y la de la
    otra puede ganar la otra (lost update), porque trabajamos desde el estado leído, no
    desde la fila versionada. La transacción protege la *escritura en dos tablas*, no el
    *valor usado como base de la decisión*. En el nombre del `docs/decisions/001`
    anotamos el siguiente paso honesto: revisar cómo leer para decidir sin pisar al otro
    cliente.