# Ticket de salida · Clase 2

Respuestas breves y con palabras propias. Individual.

1. **¿Qué información comunica el método HTTP?**
   La **intención** de la operación sobre el recurso: leer, crear, modificar parcialmente o
   eliminar. La ruta dice *sobre qué*; el método dice *qué quiero hacer* con ello. Por eso
   `GET /requests` y `POST /requests` son dos endpoints distintos aunque compartan dirección.

2. **¿Qué diferencia existe entre path parameter y query parameter?**
   El **path parameter identifica un recurso concreto** y forma parte de su dirección
   (`/requests/42` es *esa* solicitud, y falla si no existe). El **query parameter modifica
   cómo se presenta o filtra la colección**, sin cambiar cuál es el recurso
   (`/requests?status=open` puede devolver una lista vacía y seguir siendo correcto).

3. **¿Por qué `200` con un body de error representa un contrato contradictorio?**
   Porque el **estado y el cuerpo se contradicen**: la primera línea afirma éxito (`200`) y el
   cuerpo describe un fallo. Un cliente automático que decide por el estado actuaria como si
   todo hubiese salido bien. De hecho, esto era exactamente lo que hacía la API Lite al
   consultar un `id` inexistente.

4. **¿Qué problema resuelve Express que ya habíamos experimentado manualmente?**
   El **trabajo mecánico** que en la clase 1 hacíamos con condicionales sobre la URL y
   concatenación de cabeceras: el enrutamiento (método + ruta → manejador), la lectura del
   cuerpo JSON (`express.json()`) y la construcción de la respuesta (`status`, `json`). No
   cambia el contrato HTTP: lo hace menos verboso.

5. **¿Por qué HTTP es suficiente para nuestro proyecto y cuándo dejaría de serlo?**
   Porque la interacción es **puntual y siempre iniciada por el cliente** (consultar, crear,
   listar), sin necesidad de mantener una conexión abierta ni de que el servidor envíe datos
   sin que se los pidan. Dejaría de alcanzar si el servidor tuviera que **empujar información
   sin consulta previa**, como en notificaciones o un dashboard que se actualiza solo.