# Actividad comparativa · Elegir la forma de comunicación según el problema

> Bloque de referencia: **08 · HTTP no es la única conversación** · Modalidad: individual · Tiempo estimado: 30–40 min

Durante toda la clase 2 estudiamos HTTP como un contrato: un método declara la intención, una URL identifica el recurso, un código de estado informa qué ocurrió. Ese contrato resuelve la enorme mayoría de los problemas que vas a encontrar.

Pero no todos. Esta actividad existe para que practiques la decisión, no la tecnología.

## Consigna

Elegí **un solo problema** de la lista siguiente. Uno, no varios.

* **Chat** — dos o más personas intercambian mensajes en tiempo real.
* **Dashboard** — un tablero que muestra indicadores actualizados a medida que cambian.
* **Sensor** — un dispositivo con batería y red inestable que reporta una lectura cada cierto tiempo.
* **Procesamiento de reporte** — generar un archivo pesado que tarda varios minutos.
* **Comunicación entre microservicios** — dos servicios internos que se llaman entre sí con alta frecuencia.
* **API CRUD** — crear, leer, actualizar y eliminar solicitudes desde una interfaz web.

Sobre el problema elegido, respondé por escrito estas cinco preguntas:

1. **¿Qué forma de comunicación elegirías?**
2. **¿Por qué?** Fundamentá desde las características del problema, no desde la tecnología.
3. **¿Qué ventaja obtiene el sistema con esa elección?** Concreta y verificable.
4. **¿Qué complejidad introduce?** Toda elección tiene un costo: nombralo.
5. **¿Por qué no elegirías otra alternativa?** Descartá al menos una opción plausible y explicá qué la vuelve inadecuada **para este caso**.

La quinta pregunta es la más importante. Descartar bien demuestra más criterio que elegir bien.

## Tabla de orientación

Esta tabla te indica qué alternativas vale la pena considerar en cada caso. **No contiene la respuesta**: en varias filas hay más de una opción defendible, y la decisión depende de supuestos que vos tenés que explicitar.

| Problema | Alternativas plausibles a evaluar |
|---|---|
| Chat | WebSocket · SSE + peticiones HTTP · HTTP con consultas periódicas |
| Dashboard | SSE · WebSocket · HTTP con consultas periódicas |
| Sensor | MQTT · HTTP · AMQP |
| Procesamiento de reporte | AMQP (cola) · HTTP sincrónico · HTTP + consulta de estado |
| Comunicación entre microservicios | gRPC sobre HTTP/2 · API HTTP con JSON · AMQP |
| API CRUD | HTTP · gRPC · GraphQL sobre HTTP |

Antes de decidir, escribí los supuestos que estás asumiendo: cuántos usuarios, con qué frecuencia, qué pasa si se pierde un mensaje, cuánto tolera esperar quien usa el sistema. Dos respuestas distintas pueden ser correctas si parten de supuestos distintos y los declaran.

## Precisiones que deben respetarse

Estas afirmaciones tienen que aparecer bien usadas en tu respuesta si mencionás alguna de estas opciones:

* **SSE** es unidireccional, del servidor al cliente, y funciona **sobre HTTP**. No es un protocolo aparte.
* **WebSocket** es bidireccional y persistente, y su conexión se establece a partir de un handshake HTTP con `101 Switching Protocols`.
* **gRPC** es un modelo RPC, habitualmente sobre HTTP/2, con Protocol Buffers. No es "JSON con otro nombre".
* **HTTP/2** conserva métodos, URLs, encabezados, cuerpos y códigos de estado; cambia el framing binario, la multiplexación, los streams y la compresión de encabezados. Binario **no** significa cifrado.
* **REST** es un estilo arquitectónico, no un protocolo. **GraphQL** es un lenguaje de consulta con su runtime, tampoco es un protocolo.
* **MQTT** es publish/subscribe pensado para dispositivos limitados. **AMQP** apunta al encolado confiable y al trabajo asincrónico.

Si en tu respuesta escribís "uso WebSocket porque es más moderno" o "uso gRPC porque es más rápido", volvé a empezar: eso no es un criterio, es una opinión sin fundamento.

## Formato de entrega

Una página. Estructura sugerida:

1. Problema elegido y supuestos declarados (3–4 líneas).
2. Las cinco respuestas, una por párrafo corto.
3. Una frase final que resuma tu criterio.

## Cómo se evalúa

| Aspecto | Qué se espera |
|---|---|
| Fundamentación | El motivo surge del problema, no de la popularidad de la herramienta |
| Precisión técnica | Las afirmaciones sobre cada opción son correctas |
| Costo asumido | Se nombra explícitamente la complejidad que introduce la elección |
| Descarte | Se rechaza al menos una alternativa con un argumento válido |

> El criterio siempre es el problema, nunca la tecnología de moda. Una API HTTP bien diseñada es una respuesta excelente cuando el problema es un CRUD; elegir algo más sofisticado sin necesidad no es sofisticación, es costo.
