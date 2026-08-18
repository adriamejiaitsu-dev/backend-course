# Entrega 01 — El viaje de una petición

## 1. Instrucciones para ejecutar

```bash
# Asegurarse de tener Node.js instalado (node --version)
cd activities/class-01
node src/server.js
```

El servidor arranca en `http://localhost:3000`. Abrir esa URL en el navegador.

Rutas disponibles:

- `http://localhost:3000/` — bienvenida
- `http://localhost:3000/health` — estado del servidor
- `http://localhost:3000/api/info` — información en JSON
- Cualquier otra ruta retorna `404 Not found`

Para detener el servidor: `Ctrl + C` en la terminal.

---

## 2. Diagrama del recorrido de una petición

```
┌──────────┐     ┌────────────┐     ┌─────────────────────────────────┐
│  Usuario  │────▶│  Navegador │────▶│  Petición HTTP                  │
│  (clic)   │     │ (Frontend) │     │  GET http://localhost:3000/health│
└──────────┘     └────────────┘     └──────────────┬──────────────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │  Puerto 3000          │
                                        │  (puerta de entrada)  │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │  Node.js (Backend)    │
                                        │  Recibe request       │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │  Inspecciona URL      │
                                        │  request.url === ?    │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │  Decide respuesta     │
                                        │  (estado, headers,    │
                                        │   cuerpo)             │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │  Envía respuesta      │
                                        │  response.end()       │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │  Navegador recibe y   │
                                        │  presenta el resultado│
                                        └───────────────────────┘
```

---

## 3. Laboratorio de fallas — Explicación de las 6 fallas diagnosticadas

### Fault 1 — El navegador espera indefinidamente en `/health`

**Comportamiento observado:**
`http://localhost:3000/health` deja la pestaña cargando indefinidamente. `/` responde normal. La terminal imprime `GET /health` y no muestra ningún error.

**Hipótesis:**
Si la terminal registra la petición pero la respuesta nunca llega, entonces el código entra al bloque de `/health` pero no cierra la respuesta.

**Evidencia:**
La terminal imprime `GET /health`, así que la petición sí llega y sí entra al handler. Comparando el bloque de `/health` con el de `/`, al de `/health` le falta la llamada que envía la respuesta.

**Causa:**
En el bloque de `/health` falta `response.end('OK')`. Sin esa llamada, el servidor nunca envía el cuerpo de la respuesta ni cierra la conexión. El navegador queda esperando porque no recibe la señal de que la respuesta terminó.

**Corrección:**
Agregar `response.end('OK');` después del `setHeader` en el bloque de `/health`.

**Resultado:**
Las cuatro rutas funcionan correctamente: `/` → 200, `/health` → 200 OK, `/api/info` → 200 JSON, rutas inexistentes → 404.

---

### Fault 2 — `/health` retorna 404 Not found

**Comportamiento observado:**
`/health` responde con `404 Not found`. `/` funciona normal. El servidor arranca sin errores.

**Hipótesis:**
Si `/health` retorna 404 y no hay errores de arranque, entonces la condición que compara la ruta no está coincidiendo con lo que el navegador envía.

**Evidencia:**
Al revisar el código, la condición dice `request.url === '/helth'` en lugar de `request.url === '/health'`. La comparación es exacta (`===`), así que la ruta real nunca coincide con la ruta escrita en el código.

**Causa:**
Typo: `'/helth'` en vez de `'/health'`. La condición nunca es verdadera, así que el código cae en el caso por defecto y retorna 404.

**Corrección:**
Cambiar `'/helth'` por `'/health'` en la condición.

**Resultado:**
Las cuatro rutas funcionan correctamente.

---

### Fault 3 — El navegador no puede conectarse a `http://localhost:3000`

**Comportamiento observado:**
El navegador muestra error de conexión. La terminal muestra el proceso activo y la línea de arranque. En Network no hay estado, hay fallo de conexión.

**Hipótesis:**
Si el proceso está vivo pero el navegador no conecta, entonces el navegador está tocando una dirección distinta a la donde escucha el servidor.

**Evidencia:**
La línea de arranque dice `Server listening on http://localhost:3001`. El navegador intenta conectarse a `http://localhost:3000`. El puerto no coincide.

**Causa:**
La constante `PORT` está definida como `3001` en vez de `3000`. El servidor escucha en un puerto diferente al que el navegador usa.

**Corrección:**
Cambiar `const PORT = 3001;` por `const PORT = 3000;`.

**Resultado:**
Las cuatro rutas funcionan correctamente en el puerto 3000.

---

### Fault 4 — La respuesta dice que es JSON pero el consumidor no logra interpretarla

**Comportamiento observado:**
`/api/info` llega con estado 200 y Content-Type `application/json`, pero el cuerpo no es JSON válido. El navegador o un consumidor no puede parsearlo.

**Hipótesis:**
Si el Content-Type dice JSON pero el parseo falla, entonces el cuerpo enviado no tiene la estructura de JSON válido.

**Evidencia:**
El cuerpo enviado es `"{ name: 'support-server', version: 1.0.0 }"` — un string literal con comillas simples y sin comillas en las keys. No es JSON válido. La función `JSON.stringify()` no se está usando; se pasa un string directamente a `response.end()`.

**Causa:**
En lugar de enviar un objeto JavaScript convertido con `JSON.stringify()`, se envía un string que simula tener forma de JSON pero no lo es. Las comillas simples y las keys sin comillas dobles violan la especificación JSON.

**Corrección:**
Reemplazar el string literal por `JSON.stringify({ name: 'support-server', version: '1.0.0', routes: ['/', '/health', '/api/info'] })`.

**Resultado:**
Las cuatro rutas funcionan correctamente. `/api/info` retorna JSON válido.

---

### Fault 5 — Todas las rutas devuelven la misma respuesta

**Comportamiento observado:**
Cualquier ruta, incluyendo `/health`, `/api/info` y rutas inventadas, devuelve el mismo contenido: la respuesta de `/`. El primer bloque de decisión gana siempre.

**Hipótesis:**
Si todas las rutas retornan lo mismo, entonces la primera condición siempre resulta verdadera, independientemente de la ruta solicitada.

**Evidencia:**
La primera condición usa `request.url = '/'` (asignación `=`) en lugar de `request.url === '/'` (comparación `===`). La asignación siempre retorna el valor asignado (`'/'`), que es truthy, así que la condición siempre pasa. Las demás condiciones nunca se evalúan porque ya hubo un `return`.

**Causa:**
Uso de operador de asignación `=` en lugar de comparación `===`. `request.url = '/'` asigna `'/'` a la url y retorna `'/'` (truthy), por lo que la condición siempre es verdadera.

**Corrección:**
Cambiar `request.url = '/'` por `request.url === '/'`.

**Resultado:**
Las cuatro rutas funcionan correctamente, cada una con su respuesta apropiada.

---

### Fault 6 — El servidor no arranca; el proceso termina de inmediato

**Comportamiento observado:**
La terminal escribe un error y devuelve el prompt de inmediato. No hay proceso escuchando, así que el navegador nunca conecta.

**Hipótesis:**
Si el proceso termina de inmediato con un error, entonces hay una referencia a una variable que no existe.

**Evidencia:**
El error en la terminal es `ReferenceError: SERVER_PORT is not defined`. En `server.listen()` se usa `SERVER_PORT` pero la constante definida se llama `PORT`.

**Causa:**
`server.listen(SERVER_PORT, ...)` usa una variable `SERVER_PORT` que nunca se declaró. La constante definida es `PORT`. Node.js no encuentra `SERVER_PORT` y lanza un `ReferenceError` que detiene el proceso.

**Corrección:**
Cambiar `server.listen(SERVER_PORT, ...)` por `server.listen(PORT, ...)`.

**Resultado:**
Las cuatro rutas funcionan correctamente.

---

## 4. Ticket de salida

### Pregunta 1: ¿Cuál es la diferencia entre frontend y backend?

El **frontend** es el código que se ejecuta en el navegador del usuario: presenta la interfaz, recibe eventos y muestra resultados. El **backend** es un programa distinto que se ejecuta en otra máquina o proceso, recibe solicitudes del frontend y decide qué responder. La diferencia esencial es **dónde se ejecuta** y **quién controla el código**: el código del frontend está en manos del usuario (puede inspeccionarlo y modificarlo), mientras que el del backend no.

### Pregunta 2: ¿Por qué un servidor no termina después de ejecutarlo?

Cuando se ejecuta `node server.js`, Node.js crea un proceso. La llamada `server.listen(3000)` deja ese proceso activo, escuchando en el puerto 3000. Mientras haya algo pendiente de ejecutar (como esperar peticiones), Node.js no cierra el proceso. A diferencia de un script normal que imprime y termina, el servidor se queda vivo para recibir y responder peticiones.

### Pregunta 3: ¿Qué instrumento se usa primero para diagnosticar un problema?

La **terminal**. Es la primera herramienta porque responde si el proceso está vivo o murió, si registró la llegada de la solicitud y si hubo errores. Si el proceso está activo y registró la petición, el problema está del lado del servidor (la respuesta). Si no hay proceso o no llega nada, el problema está antes, en la conexión o en la dirección usada. Después de la terminal se revisa la pestaña **Network** del navegador.

### Pregunta 4: ¿Cuál es el recorrido completo de una petición?

1. El usuario introduce una URL o hace clic en un enlace
2. El navegador crea una petición HTTP
3. La petición se dirige a un puerto específico
4. El proceso de Node.js recibe la petición
5. El programa inspecciona la URL (`request.url`)
6. El programa decide qué respuesta producir (estado, headers, cuerpo)
7. El servidor completa la respuesta con `response.end()`
8. El navegador recibe y presenta el resultado al usuario

### Pregunta 5: Si el navegador muestra error, ¿cómo determinar si el problema es del servidor o del cliente?

Si la terminal muestra el proceso activo y registró la solicitud, el problema está del lado del servidor (llegó pero respondió mal). Si no hay proceso en la terminal o la solicitud no aparece registrada, el problema está antes: puede ser que el puerto sea incorrecto, que el proceso esté apagado o que la dirección no sea alcanzable. La distinción clave es: **el servidor recibió la petición o no llegó nunca**.

---

## 5. Profundización — Anatomy of an HTTP Transaction (Node.js)

**Recurso elegido:** "Anatomy of an HTTP Transaction" — Node.js official documentation.

### 1. ¿Qué concepto nuevo encontraste?

La estructura interna de una transacción HTTP en Node.js: cada petición passing through el servidor es un objeto `IncomingMessage` (el `request`) y cada respuesta se construye con un objeto `ServerResponse` (el `response`). La transacción tiene un ciclo de vida claro: el servidor recibe, procesa y envía, y cada paso tiene métodos específicos que controlan el flujo.

### 2. ¿Cómo se relaciona con el servidor que construimos?

Nuestro servidor usa exactamente esos dos objetos. `createServer` recibe una función que obtiene `request` (IncomingMessage) y `response` (ServerResponse). Los métodos que usamos —`request.url`, `response.statusCode`, `response.setHeader()`, `response.end()`— son parte de esa interfaz. La diferencia es que nosotros vimos solo la superficie; la documentación revela que hay mucho más control disponible (como eventos de stream y manejo de errores).

### 3. ¿Qué parte todavía no comprendes?

El manejo de errores y el ciclo de vida de los streams. Cuando una petición grande llega al servidor, los datos se reciben por partes (chunks). No estoy seguro de cómo manejar correctamente el caso en que el cliente aborta la conexión a mitad de envío, o qué pasa si `response.end()` falla.

### 4. ¿Qué evidencia o experimento podría utilizar para investigarla?

Podría crear un servidor que registre eventos en el objeto `request` (`data`, `end`, `error`) y enviar peticiones grandes con `curl` usando `--max-time` para forzar una interrupción. Observando la terminal podría ver en qué momento se disparan los eventos y cómo se comporta el servidor ante una conexión incompleta.

---

## 6. AI usage

- **Se utilizó IA:** Sí, para generar esta documentación y el código del servidor.
- **Para qué:** Para analizar el contenido de las 8 sesiones de la clase, compilar las explicaciones de las 6 fallas del laboratorio y estructurar el README con el formato requerido por la entrega.
- **Sugerencias aceptadas:** Se siguió la estructura del entregable al pie de la letra (server.js + README.md con las 6 secciones requeridas). Se documentaron las 6 fallas del laboratorio con el protocolo de diagnóstico de 7 pasos.
- **Sugerencias rechazadas o modificadas:** Ninguna. El plan se ajustó a los requisitos del curso.
- **Cómo se comprobó el resultado:** El servidor (`server.js`) fue revisado línea por línea contra el estado correcto de referencia del laboratorio (tabla de 4 rutas con sus estados y Content-Types esperados). El README fue estructurado verificando cada punto del entregable contra los criterios de evaluación.
