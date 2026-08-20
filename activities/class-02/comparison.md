# Comparación — Lite vs Full

> Comparación hecha con las dos versiones funcionando. Nombrar qué cambió y qué costó, no
> decidir cuál es «mejor».

## Tabla de dimensiones

| Dimensión       | Request API Lite | Request API Full |
| --------------- | ---------------- | ---------------- |
| Contrato        | Reconstruido por observación (tabla + evidencia) y luego corregido: `GET /requests`, `404` para inexistente, `201` al crear, `400` sin título | Definido **antes** del código en `docs/http-contract.md`; la implementación responde exactamente a ese contrato |
| Organización    | Un solo archivo (`server.js`): rutas, datos y estado conviven | Cinco archivos con responsabilidades separadas: arranque, configuración, rutas, datos, contrato |
| IA              | No se usó al analizar ni al corregir (se trabajó con la evidencia del servidor); el uso sí se registra en `ai-usage.md` | Se usó bajo restricciones declaradas: especificación primero, revisión del resultado y registro de lo aceptado/rechazado |
| Lectura         | Se lee de corrido, pero todo se mezcla: identificar el flujo exige seguir funciones pequeñas dentro del archivo | Se entra por archivo según la responsabilidad que interesa; cada pieza es corta |
| Modificación    | Cambiar un comportamiento obliga a tocar el archivo completo y arriesga romper lo demás | Cambiar el origen de los datos solo toca `data/requests.js`; cambiar rutas toca `routes/` |
| Complejidad     | Baja en volumen, mayor carga mental por acoplamiento | Más archivos que sostener, pero cada uno hace una sola cosa |
| Verificación    | `curl -i` sobre los mismos casos antes y después de corregir (A → B) | `curl -i` sobre los casos C; ningún `501` restante |
| Extensibilidad  | Agregar un endpoint se vuelve costoso: el archivo crece y las funciones se apelmazan | Agregar un endpoint se limita a `routes/`; los datos ya están aislados |

## Preguntas de reflexión

1. **¿Qué problemas del Lite eran problemas HTTP?**
   Tres: `GET /getRequests` (la ruta con verbo viola que la URL nombre el recurso, bloque 02),
   `200` en un recurso inexistente (contradice la clasificación de estados, bloque 05) y `200`
   vs `201` en la creación (el estado no comunica que se creó algo nuevo). El cuarto, aceptar
   un `POST` sin `title`, también es del contrato: el estado `200` afirma éxito aun con datos
   inválidos.

2. **¿Qué problemas eran decisiones de organización?**
   En el Lite ninguno en sentido estricto, porque todo está en un archivo: el problema de
   organización es la ausencia de organización. El `getRequests` mezcla además la decisión de
   nombrar la ruta (contrato) con la costumbre de nombrar acciones («get...») que viene del
   código, no de HTTP.

3. **¿Qué resolvió la estructura del Full?**
   Separó los motivos de cambio: el arranque del proceso (`server.js`), la configuración
   (`app.js`), las rutas (`requests.routes.js`) y el origen de los datos (`requests.js`). La
   pieza que se lee primero para consumir la API —el contrato— quedó documentada aparte
   (`docs/http-contract.md`).

4. **¿Qué complejidad introdujo?**
   La navegación entre archivos y entender cómo se conectan (`app.js` monta el router en
   `/requests`; el router importa la data). Hay más piezas que recordar al empezar, y la
   pregunta «¿dónde está esto?» ya no tiene una sola respuesta.

5. **¿Qué generó bien la IA?**
   La lógica de los tres manejadores, coherente con el contrato: el filtro como query, la
   conversión de `req.params.id` con `Number`, la validación del título y los estados
   `200/201/400/404` exactos. No añadió dependencias ni capas de más.

6. **¿Qué añadió innecesariamente?**
   No propuso nada fuera del alcance (ninguna base de datos, autenticación ni `PUT`/`DELETE`).
   En general, la tentación típica de la IA es agregar validaciones y capas de sobra; en este
   caso no se manifestó, quizá porque las exclusiones estaban escritas en la especificación.

7. **¿Cuál versión fue más fácil de entender?**
   El Full. Aunque tiene más archivos, cada responsabilidad se lee sola. En el Lite entender
   el flujo exige leer el archivo entero sosteniendo varios papeles a la vez.

8. **¿Cuál sería más fácil de extender?**
   El Full: un endpoint nuevo se agrega en `routes/`, un campo nuevo en `data/` y el contrato
   se actualiza en `docs/`. En el Lite, cualquier adición engorda el único archivo y hace
   crecer la mezcla de responsabilidades.

9. **¿Qué contrato permanecería igual si cambiamos Express?**
   Método, ruta, path y query params, headers, cuerpo JSON y códigos de estado. Esa parte la
   definen HTTP y el contrato documentado; Express solo la expresa con menos trabajo.

10. **¿Por qué HTTP es suficiente para este proyecto?**
    Porque la interacción es puntual, iniciada siempre por un cliente (`curl`), sin conexiones
    persistentes ni push del servidor: consultar, crear y listar en memoria no exige
    bidireccionalidad ni colas.

11. **¿Qué cambiaría si necesitáramos actualizaciones en vivo?**
    El servidor debería poder enviar datos sin que el cliente le pregunte. Con HTTP puro eso
    no existe; haría falta SSE (unidireccional) o WebSocket (bidireccional), según si el
    cliente solo escucha o también envía.

12. **¿Utilizaríamos SSE o WebSocket para mostrar progreso?**
    SSE, porque mostrar progreso es unidireccional: el servidor informa y el cliente solo
    escucha. WebSocket añadiría bidireccionalidad que el problema no pide.

13. **¿Qué ocurriría si crear una solicitud iniciara un proceso de veinte minutos?**
    La respuesta `201` no podría llegar «cuando el proceso termine»; el cliente esperaría
    demasiado. Haría falta separar el «se aceptó» del «terminó»: encolar el trabajo y
    devolver un estado de aceptación, o que el cliente consulte el estado después (HTTP +
    consulta de estado, o una cola).

14. **¿Cuándo sería razonable una cola de mensajes?**
    Cuando el trabajo debe completarse aunque nadie esté esperando, o cuando muchos productores
    y consumidores deben desacoplarse (por ejemplo, dos servicios que se envían solicitudes y
    quieren reintentos y orden garantizado). Esa necesidad no existe en este incremento.

## Cierre

Si tuviera que empezar de nuevo el proyecto Full, **escribiría primero el contrato y la
especificación (como pedía la consigna) y validaría con él la salida de la IA caso por caso,
en lugar de confiar en que coincidía a simple vista**. La diferencia de criterio está en eso:
no en obtener código, sino en comprobar cada estado contra la promesa escrita antes de darlo
por hecho.