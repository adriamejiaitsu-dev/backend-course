# Actividad comparativa · Elegir la forma de comunicación según el problema

> Bloque de referencia: **08 · HTTP no es la única conversación** · Modalidad: individual.

## Problema elegido y supuestos

**Procesamiento de reporte** — generar un archivo pesado que tarda varios minutos.

Supuestos declarados:

- Un usuario pide generar un reporte desde una interfaz web; puede haber varios pedidos a la
  vez.
- El proceso tarda entre 30 segundos y varios minutos, y es aceptable que el usuario lo
  espere, **siempre que no pierda el resultado y pueda ver el progreso**.
- Si el servidor se cae a mitad del procesamiento, sería aceptable tener que pedir el reporte
  de nuevo (no es misión crítica de reintento automático).

## 1. ¿Qué forma de comunicación elegirías?

**Pedir el reporte con HTTP (`POST`) y luego consultar su estado con `GET`; el progreso se
muestra con SSE.** El trabajo pesado se acepta inmediatamente (`202 Accepted` o `201` con el
id del reporte), se procesa en segundo plano y el cliente consulta el estado (o recibe el
progreso por SSE) hasta que está listo.

## 2. ¿Por qué?

Por las características del problema: la interacción **sigue siendo iniciada por el cliente**
(él pidió el reporte y él pregunta por él). No hay dos partes que deban hablar por sí solas.
La única «novedad» es que la respuesta tarda, y eso se resuelve separando el *se aceptó* del
*está listo*: HTTP responde rápido que la tarea fue aceptada, y el resultado queda
identificado por un id para consultarlo después. Una cola agrega infraestructura que el
problema no exige: aquí no hay reintentos ni desacople de productores/consumidores.

## 3. ¿Qué ventaja obtiene el sistema con esa elección?

Concreta y verificable: el cliente **nunca mantiene una conexión abierta durante los minutos
que dura el reporte** (con una sola petición síncrona se colgaría o expiraría), el resultado
es recuperable mientras no se reinicie el proceso, y el progreso es *unidireccional*: el
servidor informa y el cliente solo escucha, que es justo lo que SSE da sin protocolo aparte.

## 4. ¿Qué complejidad introduce?

- Estados intermedios que antes no existían: «aceptado», «en proceso», «listo», «falló».
- Un mecanismo para guardar el resultado (aunque siga en memoria) y asociarlo a un id.
- El cliente debe **preguntar** (polling) o **suscribirse** (SSE) en vez de esperar una
  respuesta única. Es más piezas que el CRUD simple de la clase 2, aunque ninguna de esa
  piezas es un protocolo nuevo.

## 5. ¿Por qué no elegirías otra alternativa?

Descarto **AMQP (cola de mensajes)** para este caso: su valor es el trabajo asincrónico
**desacoplado** —mensajes que se encolan, se reintentan y se reparten entre procesadores sin
que el emisor y el receptor se conozcan. Aquí el emisor es un usuario que **espera su reporte
y quiere su resultado**, no un sistema que delega trabajo en background; colocar una cola
(con su broker, sus garantías y su monitoreo) para un generador de archivos sería pagar una
infraestructura que el problema no necesita. Descarto **WebSocket para el progreso**: es
bidireccional y persistente, y el informe de progreso es de una sola dirección (servidor →
cliente); SSE alcanza y es más simple.

## Criterio

La tardanza no cambia la forma de la conversación: sigue siendo «un cliente pide, un
servidor informa». HTTP + consulta de estado (con SSE para el progreso) entrega exactamente
esa conversación con la menor complejidad posible; la cola y el bidireccional aparecerían
solo si el problema exigiera desacople o comunicación en ambas direcciones.