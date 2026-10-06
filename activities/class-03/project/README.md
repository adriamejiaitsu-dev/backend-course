# Request API v3 — proyecto transversal

API de **solicitudes de mantenimiento** construida con Express. Este es el proyecto que
evoluciona de clase en clase; en la entrega 03 crece de tres endpoints sueltos a una API con
contrato, ciclo de vida y reglas protegidas.

## Requisitos

* Node.js 18 o superior (`node --version`).

## Instalación y ejecución

```bash
cd activities/class-03/project
npm install
npm start
```

```txt
Request API v3 is running on http://localhost:3000
```

El servidor escucha en el puerto **3000**. Para detenerlo, `Ctrl + C`.

## Endpoints

| Método | Ruta             | Qué hace                                                        |
| ------ | ---------------- | ---------------------------------------------------------------- |
| GET    | `/requests`      | Lista las solicitudes. Filtros opcionales `?status=` y `?priority=` combinables; valor desconocido → `400`. |
| GET    | `/requests/:id`  | Consulta una solicitud (`200`) o `404 REQUEST_NOT_FOUND`.        |
| POST   | `/requests`      | Crea una solicitud (`201`) con id, fechas y estado `open` del servidor; `400` si el título falta o la prioridad es desconocida. |
| PATCH  | `/requests/:id`  | Actualización parcial (`200`) con transiciones controladas; `409` si la regla lo impide. |

El contrato completo está en [`docs/http-contract.md`](docs/http-contract.md).

## Formato de error

Todos los fallos responden con la misma forma: `code` para los programas, `message` para
las personas.

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot move a request from \"open\" to \"closed\""
  }
}
```

## Estructura

```txt
project/
├── README.md
├── package.json
├── docs/
│   └── http-contract.md
└── src/
    ├── app.js                     Express: JSON body, montaje de rutas y errores
    ├── server.js                  Abre el proceso y escucha en el puerto 3000
    └── modules/
        └── requests/
            ├── requests.routes.js     Recibe HTTP y responde HTTP
            ├── requests.store.js      El array, el contador de ids y la identidad
            └── request-status.js       Estados, transiciones y reglas del ciclo de vida
```

La organización es **por tema** (todo lo de solicitudes junto) y no por tipo de archivo: es
cohesión, las piezas que cambian por la misma razón viven juntas. `app.js` y `server.js` no
se mueven: su responsabilidad es de aplicación, no de un módulo.

## Datos en memoria

Los datos se guardan en `requests.store.js`: al reiniciar el servidor, la colección vuelve a
su estado inicial y el contador de identificadores vuelve a empezar. Es comportamiento
esperado y documentado, no un defecto.

## Exclusiones

Sin base de datos ni persistencia en archivo, sin `DELETE`, sin librerías de validación, sin
autenticación, sin capas controllers/services/repositories, sin dependencias además de
Express y sin frontend. Poner algo de esta lista rompe el alcance acordado, no lo amplía.
