# Request API Full

API de **solicitudes de mantenimiento** construida con Express, organizada por
responsabilidades y con el contrato HTTP documentado en `docs/http-contract.md`.

## Requisitos

* Node.js 18 o superior (`node --version`).
* Conexión a internet la primera vez, para instalar Express.

## Instalación y ejecución

```bash
cd project
npm install
npm start
```

Deberías ver:

```txt
Request API Full is running on http://localhost:3000
```

El servidor escucha en el puerto **3000**. Para detenerlo, `Ctrl + C`.

## Endpoints

| Método | Ruta             | Qué hace                                              |
| ------ | ---------------- | ----------------------------------------------------- |
| GET    | `/requests`      | Lista las solicitudes. Opcional `?status=open` filtra |
| GET    | `/requests/:id`  | Consulta una solicitud (`200`) o `404` si no existe   |
| POST   | `/requests`      | Crea una solicitud (`201`) o `400` si falta el título |

Los datos se guardan en memoria en `src/data/requests.js`: al reiniciar el servidor, la lista
vuelve a su estado inicial. La verificación se hace con `curl` (ver `../casos-de-prueba.md`).

## Estructura y responsabilidades

```txt
project/
├── README.md
├── package.json
├── docs/
│   └── http-contract.md
└── src/
    ├── app.js                     Express config: JSON body + montaje de rutas
    ├── server.js                  Inicia el proceso y escucha en el puerto 3000
    ├── routes/
    │   └── requests.routes.js     Declara los endpoints y decide cada respuesta
    └── data/
        └── requests.js            Datos en memoria y generación de ids
```

`server.js` se separó de `app.js` para poder montar la aplicación sin abrir un puerto.
`data/requests.js` aísla el origen de los datos: es lo único que cambiaría si mañana llegara
una base de datos.

## Exclusiones

Sin base de datos, sin TypeScript, sin autenticación, sin capa de
controllers/servicios/repositories, sin `PUT`/`PATCH`/`DELETE`, sin dependencias además de
Express y sin frontend. Poner algo de esta lista rompe el alcance acordado, no lo amplía.