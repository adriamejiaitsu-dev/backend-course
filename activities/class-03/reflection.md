# Reflection — Entrega 03

> Fase 5. Respuestas concretas y con evidencia: "porque lo programé" no es una respuesta.

1. **¿Qué cambió entre los endpoints de la clase 2 y el sistema actual?**

   En la clase 2 había tres endpoints, errores con la forma `{ "error": "texto" }`, los datos
   y las rutas en carpetas por tipo (`routes/`, `data/`) y un `?status` sin validar. Ahora
   hay cuatro endpoints (apareció `PATCH /requests/:id`), filtros por `status` y `priority`
   combinables con `400` para valores desconocidos, errores con `code` y `message`, el
   recurso agrupado en `modules/requests/` con una pieza nueva (`request-status.js`) que
   guarda el ciclo de vida, y el servidor dueño de la identidad: `id`, `createdAt`,
   `updatedAt`, estado inicial `open` y prioridad `medium`. Lo que no cambió: sigue siendo
   memoria y sigue sin haber `DELETE`.

2. **¿Qué regla fue más difícil de representar?**

   Que una solicitud en estado terminal rechace **cualquier** `PATCH`, incluso uno que no
   toque el `status`. El camino fácil es validar transiciones solo cuando llega el campo
   `status`, y en ese caso un `PATCH {"priority":"low"}` sobre una cerrada devolvería `200`
   y el sistema diría que modificó algo que ya no se puede modificar. La regla se resolvió
   en `checkUpdate()`: primero mira si el estado actual es terminal, y solo después mira el
   movimiento pedido. Evidencia: el caso "Modificar cerrada" de la matriz, `409
   REQUEST_IN_TERMINAL_STATUS` con body `{"priority":"low"}`.

3. **¿Qué diferencia encontraste entre validar datos y proteger una regla?**

   Validar la forma se decide mirando solo la petición: `{"status":"cerrada"}` no pertenece
   al vocabulario y devuelve `400 INVALID_STATUS_VALUE` sin consultar nada. Proteger una
   regla exige leer el estado actual del recurso: `{"status":"closed"}` es una petición
   impecable, pero sobre una solicitud `open` devuelve `409 INVALID_STATUS_TRANSITION`. La
   misma petición cambia de respuesta según cuándo llega, porque lo que cambió no fue la
   forma sino el estado.

4. **¿Por qué decidimos no implementar `DELETE`?**

   Porque el sistema está construido sobre el registro de lo que pasó con cada solicitud:
   `closed` y `cancelled` son finales que se recuerdan, y borrar destruye información en
   lugar de transformarla. Además, si un id desaparece, la promesa "lo que creé hoy siempre
   responde" se rompe y el contador deja de ser confiable. Todo está en
   `project/docs/decisions/001-cancel-instead-of-delete.md`, donde también reconozco los
   costos: la colección crece sin purga y un registro erróneo queda para siempre.

5. **¿Qué limitación sigue teniendo el array?**

   Vive en la memoria del proceso: al reiniciar se pierde todo y `nextId` vuelve a 4, así
   que podría repetir ids que un cliente todavía guarda (lo vi al reiniciar entre grupos de
   pruebas). Además no controla concurrencia (dos `PATCH` simultáneos se aplican el uno
   detrás del otro sin detectarse) y crece sin límite: sin paginación, `GET /requests`
   devuelve terminadas junto con pendientes.

6. **¿Qué parte se volvería problemática si agregamos otro recurso?**

   La traducción de resultados de dominio a HTTP: `sendError()` y el mapeo
   `REQUEST_NOT_FOUND → 404` / `INVALID_STATUS_TRANSITION → 409` están dentro de
   `requests.routes.js`. Con un segundo recurso habría que repetirlos o extraerlos a un
   helper común, y ahí empieza la tentación de crear controllers/services "para no
   duplicar". También `MODIFIABLE_FIELDS` es una lista por recurso: cada uno tendrá que
   declarar la suya.

7. **¿Qué sugerencia de IA rechazaste?**

   La de agregar `DELETE /requests/:id` "para completar el CRUD", junto con la de meter
   controllers/services/repositories y una librería de validación. Las tres chocan con el
   alcance escrito de la entrega y con la decisión 001; quedaron registradas con su porqué
   en `ai-usage.md` (sección *What I rejected or changed*). La que más me costó descartar
   fue `DELETE`, porque era la opción que menos código parecía costar.

8. **¿Qué evidencia demuestra que una transición inválida está protegida?**

   La salida literal de `curl -i` copiada en la sección *Evidencia* de `test-matrix.md`:

   ```txt
   HTTP/1.1 409 Conflict
   {"error":{"code":"INVALID_STATUS_TRANSITION","message":"Cannot move a request from \"open\" to \"closed\""}}
   ```

   Petición con JSON impecable y un estado que sí existe, rechazada igual. Y el contraste:
   el mismo campo `status` con `in_progress` devolvió `200` sobre esa misma solicitud, así
   que el `409` no es una rama genérica que rechaza todo, es el mapa de transiciones
   decidiendo. Acompañado por `409 REQUEST_IN_TERMINAL_STATUS` sobre la cerrada, que es la
   otra mitad de la regla.
