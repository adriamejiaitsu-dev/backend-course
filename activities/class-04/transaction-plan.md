# Transaction plan — el cambio de estado con historia

> Fase 1 · se completa **antes** de escribir la transacción. Si una pregunta no tiene
> respuesta en papel, el código la va a improvisar.

1. **¿Qué operaciones forman la unidad?**
   El `UPDATE` de `requests` (nuevo `status` + `updated_at`) y el `INSERT` del evento en
   `request_status_history` (`previous_status` → `new_status`). Además, en la creación:
   el `INSERT` de la solicitud y el `INSERT` de su nacimiento (`NULL → open`).

2. **¿Qué ocurre si falla la primera (el `UPDATE`)?**
   Nada cambió todavía: no hay historia que registrar. Se ejecuta `ROLLBACK` (aunque
   sobre una transacción sin escrituras), se libera el cliente y el error se propaga —
   la ruta responde `503` si es la base, o el código de dominio que corresponda. La base
   queda exactamente como estaba.

3. **¿Qué ocurre si falla la segunda (el `INSERT` de historia)?**
   Es el accidente que motiva el diseño: sin protección, la solicitud quedaría cambiada
   **sin su historia** — una mentira silenciosa. Con la transacción, el `ROLLBACK`
   deshace también el `UPDATE`: las dos tablas vuelven al estado previo. Se relanza el
   error; **revertir no es ocultar**.

4. **¿Cuándo se ejecuta `COMMIT`?**
   Solo después de que ambas consultas terminaron sin lanzar. No hay `COMMIT` parcial ni
   entre consultas.

5. **¿Cuándo se ejecuta `ROLLBACK`?**
   En el `catch`: ante cualquier error (de red, de restricción, de la propia aplicación).
   Un `ROLLBACK` de una transacción ya confirmada no hace nada, pero el flujo es único:
   `try → COMMIT` / `catch → ROLLBACK + relanzar`.

6. **¿Qué cliente ejecuta las consultas?**
   **Un solo cliente obtenido con `pool.connect()`**. Nunca `pool.query()`: cada
   `pool.query()` puede tomar *otra* conexión del pool y el `BEGIN` no cubre nada — el
   error sería invisible y la "transacción" sería decorativa.

7. **¿Cuándo se libera el cliente?**
   En `finally`: `client.release()` corre haya habido `COMMIT`, `ROLLBACK` o error antes
   de empezar. Olvidarlo hace perder clientes del pool hasta agotarlo y dejar toda la API
   sin responder.

8. **¿Qué inconsistencia concreta evita esta unidad?**
   Una solicitud con `status = 'in_progress'` cuyo historial no contiene el evento
   `open → in_progress`: al preguntar "¿cuándo pasó a in_progress?" el sistema no podría
   responderlo. También evita lo inverso: un evento de historia apuntando a un estado que
   `requests` nunca tuvo (o a una solicitud que no existe — eso ya lo impide la FK).

## La creación también es una unidad

Al crear se escriben dos cosas: la fila en `requests` y su primer evento de historia
(`NULL → open`). Si la solicitud se creara sin su nacimiento, la historia empezaría más
tarde, con un hueco silencioso: el registro diría que el primer cambio fue
`open → in_progress` sin explicar de dónde salió el `open`. Por eso van juntas en la misma
transacción, con el mismo cliente, el mismo `COMMIT` y el mismo `finally`.
