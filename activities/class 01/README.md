# Entrega 01 — El viaje de una petición

## 1. Instrucciones para ejecutar

```bash
node src/server.js
```

El servidor arranca y queda escuchando en `http://localhost:3000`. Para detenerlo, presioná `Ctrl+C` en la terminal.

Rutas disponibles:

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/` | GET | Mensaje de bienvenida |
| `/health` | GET | Estado del servidor (`OK`) |
| `/api/info` | GET | Información del servidor en JSON |
| Cualquier otra | GET | Respuesta `404` |

---

## 2. Diagrama del recorrido de una petición

```
┌──────────┐    ①    ┌──────────┐    ②    ┌──────────────────┐
│          │ ──────▶ │          │ ──────▶ │                  │
│  Usuario │         │Navegador │         │ Servidor Node.js │
│          │ ◀────── │          │ ◀────── │   (localhost:3000)│
└──────────┘    ⑧    └──────────┘    ⑦    └──────────────────┘
                                               │         ▲
                                        ③      │         │  ⑥
                                               ▼         │
                                      ┌──────────────┐   │
                                      │   Puerto     │   │
                                      │   3000       │   │
                                      └──────────────┘   │
                                               │         │
                                        ④      │         │  ⑥
                                               ▼         │
                                      ┌──────────────────┐
                                      │ request.url      │
                                      │ (inspección)     │
                                      │                  │
                                      │ ⑤ Decisión de    │
                                      │    respuesta     │
                                      └──────────────────┘
```

**Secuencia paso a paso:**

1. El usuario escribe `http://localhost:3000/health` en el navegador.
2. El navegador crea una petición HTTP y la envía al puerto 3000.
3. La petición llega al puerto donde Node.js está escuchando.
4. El proceso de Node.js recibe la petición (`request`).
5. El programa inspecciona `request.url` y compara con las rutas definidas.
6. El programa produce la respuesta correspondiente (`response.writeHead` + `response.end`).
7. El servidor completa la respuesta y el navegador la recibe.
8. El navegador muestra el resultado en pantalla.

---

## 3. Explicación de una falla diagnosticada — Falla 3 (fault-3)

**Comportamiento observado:** Al intentar acceder a `http://localhost:3000`, el navegador no obtiene respuesta. En la pestaña Network no aparece ningún estado: se muestra un error de conexión. Sin embargo, en la terminal, el proceso está activo y muestra una línea de arranque.

**Hipótesis inicial:** El servidor no está corriendo porque el navegador dice que no se puede conectar.

**Evidencia revisada:** Mirando la terminal, el proceso sí está activo (no volvió el prompt). La línea de arranque mostraba `Servidor escuchando en http://localhost:3001`, no `:3000`.

**Causa encontrada:** El servidor estaba configurado para escuchar en el puerto 3001, pero el navegador intentaba conectarse a `localhost:3000`. Ninguno de los dos estaba mal: simplemente apuntaban a puertos distintos.

**Modificación realizada:** Se cambió `server.listen(3001, ...)` por `server.listen(3000, ...)` en el código.

**Resultado:** Al reiniciar el proceso con `node fault-3.js`, el navegador conectó correctamente y devolvió la respuesta esperada.

**Explicación final:** Un servidor es un programa que escucha en un puerto específico. Si el navegador usa una dirección distinta a la que el servidor está escuchando, la petición nunca llega. La terminal es la primera herramienta para verificar dónde está escuchando el proceso. En este caso, la evidencia clave estaba en la propia línea de arranque impresa por el servidor.

---

## 4. Respuestas al ticket de salida

### Pregunta 1: ¿Qué diferencia hay entre frontend y backend?

El frontend es el código que se ejecuta en el navegador del usuario y muestra la interfaz visual. El backend es un programa distinto que se ejecuta en otra computadora o proceso, recibe solicitudes y decide qué responder. La diferencia esencial es dónde se ejecuta el código y quién es dueño de la decisión: el frontend corre en el navegador del usuario (y el usuario puede modificarlo), mientras que el backend corre en un servidor que el usuario no controla.

### Pregunta 2: ¿Por qué un servidor puede quedarse esperando sin terminar?

Porque al ejecutar `server.listen()`, Node.js deja el proceso activo y en espera de conexiones entrantes. A diferencia de un script normal que ejecuta sus instrucciones y termina, un servidor permanece vivo mientras haya algo pendiente de atender. Node detecta que el proceso tiene un listener activo y no lo cierra.

### Pregunta 3: ¿Qué mirarías primero si un usuario dice "no funciona"?

Miraría la terminal del servidor. Es la primera pregunta que responde: ¿el proceso está vivo o murió? Si el proceso está activo, sé que el servidor existe y el problema puede estar en la conexión, la URL o la ruta. Si el proceso no está corriendo, el problema es que nadie está escuchando. Después pasaría a la pestaña Network del navegador para ver si la petición llegó y qué estado devolvió.

### Pregunta 4: ¿Cómo se recorre el viaje completo de una petición?

1. El usuario introduce una URL en el navegador.
2. El navegador crea una petición HTTP.
3. La petición se dirige al puerto indicado en la URL.
4. El proceso de Node.js recibe la petición.
5. El programa inspecciona la URL solicitada.
6. El programa decide qué respuesta producir.
7. El servidor completa la respuesta (con `response.end()`).
8. El navegador recibe y presenta el resultado.

### Pregunta 5: Si el proceso está activo pero el navegador no conecta, ¿dónde está el problema?

Si la terminal muestra el proceso activo y registró la solicitud, el problema está del lado del servidor: la ruta puede estar mal escrita, la respuesta puede no cerrarse correctamente, o el contenido puede no ser lo esperado. Si la terminal muestra el proceso activo pero NO registra la solicitud, el problema está antes: el navegador está tocando un puerto distinto o la dirección es inalcanzable.

---

## 5. Profundización — Lectura: Introduction to Node.js

**Recurso consultado:** [Introduction to Node.js](https://nodejs.org/learn/getting-started/introduction-to-nodejs)

### 5.1 ¿Qué concepto nuevo encontraste?

La idea de que Node.js fue diseñado con un modelo de E/S sin bloqueo (non-blocking I/O) y orientado a eventos. Esto significa que en lugar de esperar a que una operación de lectura de archivo o una consulta a la base de datos termine para seguir con el siguiente código, Node.js lanza la operación y pasa a ejecutar otra cosa. Cuando la operación termina, Node.js ejecuta un callback asociado a ese evento.

### 5.2 ¿Cómo se relaciona con el servidor que construí?

Se relaciona directamente con por qué `server.listen(3000)` no bloquea la terminal de la misma forma que lo haría un bucle infinito. Node.js queda escuchando en el puerto de forma eficiente, sin consumir recursos innecesarios mientras espera conexiones. Cuando un cliente se conecta, el callback que pasamos a `createServer` se ejecuta. Este modelo explica cómo un solo proceso puede atender múltiples peticiones sin necesidad de crear un hilo nuevo para cada una.

### 5.3 ¿Qué parte todavía no comprendes?

No termino de entender cómo Node.js decide cuándo ejecutar el callback del servidor frente a otras tareas pendientes. Si el proceso estuviera haciendo otra cosa (por ejemplo, leyendo un archivo grande), ¿el callback de la petición HTTP se queda esperando? ¿O se ejecuta de forma concurrente?

### 5.4 ¿Qué evidencia o experimento podría utilizar para investigarlo?

Podría crear un servidor que, al recibir una petición en una ruta específica, simule una tarea larga con `setTimeout` y ver si otra petición simultánea se atiende o se bloquea. Si ambas se atienden (aunque una espere), confirmaría que el modelo es de evento y no de bloqueo. También podría insertar `console.log` antes y después de la tarea pesada para observar el orden de ejecución.

---

## 6. AI usage

- **¿Utilizaste IA?** Sí.
- **¿Para qué la utilizaste?** Para verificar que la estructura del `server.js` cumpliera con los requisitos de la entrega y para revisar que las respuestas del ticket de salida fueran precisas y使用aran el vocabulario correcto de la clase.
- **¿Qué sugerencia aceptaste?** La de usar `process.uptime()` en la ruta `/api/info` para devolver información útil y dinámica en la respuesta JSON.
- **¿Qué sugerencia rechazaste o modificaste?** La IA sugirió agregar una ruta adicional `/api/time` que devolviera la hora actual. La rechacé porque no estaba entre las rutas solicitadas en el entregable y quería mantener el servidor fiel a lo que la clase pide.
- **¿Cómo comprobaste el resultado?** Ejecuté `node src/server.js` y probé cada ruta con el navegador, verificando en la pestaña Network que los códigos de estado y los Content-Type fueran correctos. También verifiqué que la ruta 404 se activara para rutas inexistentes.
