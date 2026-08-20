# Request API Full — plantilla de inicio

Este proyecto es un **andamiaje**, no una solución. El servidor arranca y responde, pero los
tres endpoints devuelven `501 Not Implemented`: la lógica es tu trabajo.

La API administra **solicitudes de mantenimiento**, el mismo recurso del proyecto Lite. La
diferencia no está en lo que hace, sino en cómo está organizado.

## Requisitos

* Node.js 18 o superior (`node --version`).
* Conexión a internet la primera vez, para instalar Express.

## Instalación y ejecución

```bash
cd request-api-full-template
npm install
node src/server.js
```

También puedes usar `npm start`. Deberías ver:

```txt
Request API Full is running on http://localhost:3000
```

Comprueba que el andamiaje responde:

```bash
curl -i http://localhost:3000/requests
# HTTP/1.1 501 Not Implemented
# {"error":"Not implemented"}
```

Ese `501` es correcto **al principio**: significa «esta ruta existe, pero todavía no hace
nada». Tu trabajo es hacer que deje de aparecer.

## Estructura y responsabilidades

```txt
request-api-full-template/
├── README.md
├── package.json
├── docs/
│   └── http-contract.md
└── src/
    ├── app.js
    ├── server.js
    ├── routes/
    │   └── requests.routes.js
    └── data/
        └── requests.js
```

| Archivo                        | De qué se encarga                                                                 | Estado          |
| ------------------------------ | --------------------------------------------------------------------------------- | --------------- |
| `src/server.js`                | Arranca el proceso y escucha en el puerto 3000. No sabe nada de rutas.            | Completo        |
| `src/app.js`                   | Crea la aplicación de Express, activa `express.json()` y monta el router.         | Completo        |
| `src/data/requests.js`         | Guarda las solicitudes en memoria y genera identificadores con `generateId()`.    | Completo        |
| `src/routes/requests.routes.js`| Declara los tres endpoints y decide qué responde cada uno.                        | **Tu trabajo**  |
| `docs/http-contract.md`        | El contrato HTTP de la API, escrito por ti.                                       | **Tu trabajo**  |

La separación importa por una razón concreta: `server.js` puede cambiar de puerto sin tocar
las rutas, y `app.js` puede montarse en una prueba automática sin abrir ningún puerto.

## Qué debes completar

1. **`docs/http-contract.md` primero.** Define método, ruta, entrada, respuesta de éxito y
   respuestas de error de los tres endpoints. Escribe el contrato antes que el código.
2. **`src/routes/requests.routes.js`.** Reemplaza cada `501` por la implementación real.
   Cada manejador tiene un `// TODO:` que describe el comportamiento y los estados esperados:
   * `GET /requests` → `200` con el arreglo de solicitudes.
   * `GET /requests/:id` → `200` con la solicitud, o `404` si no existe.
   * `POST /requests` → `201` con la solicitud creada, o `400` si falta el `title`.
3. **Verificación manual.** Ejecuta los casos de prueba de `casos-de-prueba.md` con `curl` y
   registra el resultado observado de cada uno.
4. **Registro de uso de IA.** Completa `ai-usage.md` mientras trabajas, no al final.

El router se monta en `/requests` desde `app.js`. Por eso, dentro del router, la ruta `'/'`
corresponde a `/requests` y `'/:id'` corresponde a `/requests/:id`.

## Qué queda explícitamente fuera

Estas exclusiones no son sugerencias: entregar algo de esta lista cuenta como no cumplir la
consigna. El objetivo es que el contrato HTTP y la organización de archivos sean lo único que
tengas que defender.

* **Sin base de datos.** Los datos viven en memoria, en `src/data/requests.js`.
* **Sin TypeScript.** JavaScript con módulos ES (`import` / `export`).
* **Sin autenticación** ni sesiones ni tokens.
* **Sin capa de controladores, servicios o repositorios.** La lógica vive en el router.
* **Sin actualizar ni eliminar solicitudes.** No hay `PUT`, `PATCH` ni `DELETE`.
* **Sin dependencias adicionales.** Solo Express.
* **Sin frontend.** La verificación es con `curl` o un cliente HTTP.

Si una herramienta de IA propone cualquiera de estas cosas, rechazarla es parte del ejercicio
y debe quedar anotado en `ai-usage.md`.
