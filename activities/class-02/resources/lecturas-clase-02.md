# Lecturas de la clase 2 · HTTP: el contrato entre cliente y servidor

Diez recursos externos para profundizar lo que trabajamos en clase. Cada uno tiene, dentro de su bloque, una guía de lectura que indica por qué consultarlo, qué parte revisar, qué intentar comprender y qué producir después.

Ninguna de estas guías es un enlace suelto: todas te proponen una pregunta y un resultado concreto. Una lectura hecha con una pregunta en la cabeza rinde más que tres lecturas completas sin propósito.

## Los diez recursos

| # | Título | Fuente | Clasificación | Tiempo |
|---|---|---|---|---|
| 1 | Overview of HTTP | MDN Web Docs | Esencial | 20 min |
| 2 | HTTP request methods | MDN Web Docs | Esencial | 15 min |
| 3 | HTTP response status codes | MDN Web Docs | Esencial | 20 min |
| 4 | Express routing | Express | Esencial | 20 min |
| 5 | HTTP/2 — RFC 9113 | IETF / RFC Editor | Profundización | 30 min |
| 6 | Introduction to gRPC | gRPC | Profundización | 20 min |
| 7 | The WebSocket Protocol — RFC 6455 | IETF | Referencia | Consulta puntual |
| 8 | Server-sent events | WHATWG | Recomendado | 15 min |
| 9 | MQTT Version 5.0 | OASIS | Referencia | Consulta puntual |
| 10 | Advanced Message Queuing Protocol | OASIS | Referencia | Consulta puntual |

## Dónde encontrar cada uno

| # | Bloque de la clase | Archivo de la guía |
|---|---|---|
| 1 | 01 · Reconexión y HTTP como contrato | `01-reconexion-contrato/resources/lecturas/01-overview-http.md` |
| 2 | 04 · Métodos como intenciones | `04-metodos-intenciones/resources/lecturas/02-metodos-http.md` |
| 3 | 05 · Anatomía de una respuesta y códigos de estado | `05-respuesta-estados/resources/lecturas/03-estados-http.md` |
| 4 | 07 · Del servidor nativo a Express | `07-node-a-express/resources/lecturas/04-express-routing.md` |
| 5 | 08 · HTTP no es la única conversación | `08-otros-protocolos/resources/lecturas/05-http2-rfc9113.md` |
| 6 | 08 · HTTP no es la única conversación | `08-otros-protocolos/resources/lecturas/06-grpc-introduccion.md` |
| 7 | 08 · HTTP no es la única conversación | `08-otros-protocolos/resources/lecturas/07-websocket-rfc6455.md` |
| 8 | 08 · HTTP no es la única conversación | `08-otros-protocolos/resources/lecturas/08-server-sent-events.md` |
| 9 | 08 · HTTP no es la única conversación | `08-otros-protocolos/resources/lecturas/09-mqtt.md` |
| 10 | 08 · HTTP no es la única conversación | `08-otros-protocolos/resources/lecturas/10-amqp.md` |

---

## Cómo usar estas lecturas

Las clasificaciones no ordenan calidad: indican **cuándo** conviene abrir cada recurso y con cuánta profundidad.

### Antes de la clase 3

Los recursos **1, 2, 3 y 4** son **esenciales** y sostienen todo lo que sigue. Leelos —o al menos releé sus guías— antes del próximo encuentro.

Los tres primeros construyen el vocabulario del contrato: qué contiene una petición, qué declara un método, qué informa un código de estado. El cuarto es el puente hacia el código: muestra cómo Express expresa ese mismo contrato sin modificarlo. Sin estas cuatro lecturas, la clase 3 se vuelve una lista de reglas para memorizar en lugar de un conjunto de decisiones que se entienden.

Si solo tenés tiempo para dos, que sean la **2** y la **3**: métodos y códigos de estado son las dos elecciones que vas a tomar en cada ruta que escribas de acá en adelante.

### Opcionales, para ampliar el panorama

Los recursos **5 y 6** son de **profundización** y el **8** es **recomendado**. No hacen falta para resolver el proyecto, pero explican por qué el ecosistema se ve como se ve.

* El **5 (HTTP/2)** te muestra que el contrato que aprendiste sobrevive intacto aunque cambie el transporte. No se te exige leer el RFC completo: la guía indica las cuatro secciones que alcanzan.
* El **6 (gRPC)** presenta un modelo distinto —operaciones en lugar de recursos— y evita el malentendido de creer que todo lo que no es HTTP es "JSON con otro nombre".
* El **8 (SSE)** es corto y muy rentable: enseña que muchas veces no hace falta una conexión bidireccional, porque el servidor informa y el cliente solo escucha. Además, sigue estando sobre HTTP.

### Solo referencia de consulta

Los recursos **7, 9 y 10** son documentos normativos: la especificación de WebSocket y los estándares de MQTT y AMQP. **No se leen de principio a fin.** Se abren para confirmar un dato puntual y se cierran.

Lo que sí necesitás de ellos es la idea central, y esa está en la guía correspondiente, no en el documento:

* **WebSocket** — bidireccional y persistente, iniciado con un handshake HTTP.
* **MQTT** — publish/subscribe para dispositivos limitados.
* **AMQP** — encolado confiable para trabajo asincrónico.

Con esas tres frases entendidas alcanza para esta clase. El documento queda disponible para el día que tengas que implementar uno.

---

## Después de las lecturas

Cuando termines los cuatro esenciales y al menos una de las lecturas del bloque 08, resolvé la [actividad comparativa de protocolos](actividad-comparativa-protocolos.md). Ahí vas a tener que elegir una forma de comunicación para un problema concreto y, sobre todo, justificar por qué descartás las otras.

> El criterio siempre es el problema, nunca la tecnología de moda.
