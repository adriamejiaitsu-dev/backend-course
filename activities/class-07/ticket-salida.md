# Ticket de salida — Clase 07

Responde con tus palabras, con ejemplos de TU guardia. Aquí están las 13 preguntas
con respuestas guiadas por lo que hicimos en la guardia; ajústalas a tu experiencia,
porque reflejan tu proceso, no las láminas.

## Sobre el diagnóstico

**1. ¿Qué diferencia existe entre síntoma y causa? Da el ejemplo de uno de tus incidentes.**
El síntoma es lo que se OBSERVA; la causa es lo que LO PRODUCE. En INC-701, el síntoma era
`500 INTERNAL_ERROR` en pantalla; la causa era que `Number('not-a-number')` produce `NaN` y ese
valor inválido viajaba hasta la consulta SQL. El 500 "aparecía" en la base, pero "se originaba"
en la ruta.

**2. ¿Por qué debemos reproducir antes de corregir?**
Porque un bug que no puedes reproducir no puedes demostrar que lo corregiste. Si cambias código
al azar no sabes qué lo arregló ni si volverá. `npm run incidents:reproduce` mostró `REPRODUCED`
antes y `RESOLVED` después — esa comparación es la evidencia del arreglo.

**3. ¿Qué diferencia existe entre un error esperado y uno inesperado, y qué hace tu backend distinto con cada uno?**
El esperado es parte del contrato y el sistema puede responderlo deliberadamente (400, 401, 403,
404, 409, 503). El inesperado es un defecto o dependencia rota: responde un 500 genérico y deja
el detalle (mensaje + stack) en el log. El error handler central decide la rama según el caso.

## Sobre el contrato

**4. ¿Por qué un ID inválido devuelve 400 y uno inexistente 404?**
El 400 dice "tu petición está mal formada" (problema del consumidor); el 404 dice "la petición
está bien, pero el recurso no existe". Son dos historias distintas: `not-a-number` nunca podrá
existir; `999999999` es un id válido que simplemente no coincide con ninguna fila.

**5. ¿Por qué validamos la prioridad en la aplicación si PostgreSQL ya tiene una restricción?**
Son DOS defensas con audiencias distintas: la aplicación responde al CONSUMIDOR con un 400 claro
antes de ejecutar SQL; la restricción CHECK protege la INTEGRIDAD de la base si la app falla o si
otro proceso escribe directo. Sin la app, el usuario recibe un 500 mudo; sin la restricción, un
dato inválido puede vivir en la tabla. Se conservan ambas.

## Sobre el sistema

**6. ¿Qué responsabilidad tiene el middleware de errores?**
Ser el ÚNICO traductor de errores a respuestas: decide el status y el body público, loguea el
detalle interno de los inesperados y agrega el requestId a todo body de error.

**7. ¿Por qué debe registrarse después de las rutas?**
Un middleware de errores solo ve lo que ocurrió ANTES en app.js. Si se registra antes, las rutas
que lanzan errores nunca lo alcanzan. Además, `notFound` va justo antes: él genera el error que
el handler traduce.

**8. ¿Qué permite hacer un request ID que antes era imposible?**
Unir la respuesta que el usuario reenvía con la línea de log exacta que la produjo. Antes, si
cinco usuarios recibían 500 a la vez, el log era una multitud anónima sin forma de saber cuál
línea correspondía a cuál.

**9. ¿Qué información nunca debe aparecer en los logs? Nombra al menos cuatro cosas.**
1) Authorization / tokens (credencial viva); 2) passwords / hashes; 3) emails completos;
4) DATABASE_URL / cadenas de conexión; 5) cuerpos de petición. Se usa una allowlist de campos
explícitos, nunca el objeto request completo.

**10. ¿Qué diferencia existe entre /health y /ready, y quién usa cada respuesta?**
/health = "¿el proceso está VIVO?" (no toca la base, 200 siempre que el proceso respire); lo usa
un orquestador para decidir reiniciar. /ready = "¿puede atender tráfico?" (hace `SELECT 1` y
manda 503 si la base no responde); lo usa un balanceador para retirar o devolver tráfico.

## Sobre la IA y sobre ti

**11. ¿Qué hipótesis propuso la IA durante tu investigación?**
Para INC-701, que el parámetro se convierte a NaN y viaja a SQL; para INC-702, que la app no
valida priority en el camino de escritura y por eso explota la restricción CHECK.

**12. ¿Cómo la comprobaste (o la descartaste)?**
Leyendo el código real y experimentando: el REPL confirmó `Number('not-a-number') === NaN`;
verifiqué la restricción en `pg_constraint`; el script de reproducción pasó de REPRODUCED a
RESOLVED; la suite quedó 37/37. Ninguna hipótesis se aceptó sin evidencia del sistema. También
descarté la idea de validar en el store (es tarde) y el uso de `parseInt` (acepta '12abc').

**13. ¿Qué duda conservas al terminar esta clase?**
(Queda tu duda real; ejemplos: cómo se propaga el requestId si la API creciera a varios
servicios, o cómo se maneja el timeout del pool real de Supabase si la base se cae en medio de
una petición larga.)

---

> La frase que resume la clase 7: **«Dejamos de adivinar: reproducimos, observamos, comprobamos y corregimos con evidencia.»**