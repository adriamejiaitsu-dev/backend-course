# Request API v4 — proyecto transversal (Entrega 04)

API de **solicitudes de mantenimiento** con Express + PostgreSQL. En esta entrega el
proyecto de la clase 03 deja la memoria de proceso y aprende a **persistir**: los datos
viven en Supabase (PostgreSQL), las reglas se defienden en dos lugares, y cada cambio de
estado queda registrado como un hecho de la historia.

## Requisitos

* Node.js 18 o superior (`node --version`).
* Un proyecto de **Supabase** individual. Exclusión de la entrega: sin Docker ni
  PostgreSQL local.

## Instalación y ejecución

```bash
cd activities/class-04/project
npm install
cp .env.example .env        # y pegar la DATABASE_URL en .env
npm run db:check            # verifica conexión y esquema
npm start
```

```txt
Request API v4 is running on http://localhost:3000
```

Las migraciones y el `seed.sql` se ejecutan **en el SQL Editor de Supabase**; el
repositorio es la fuente de verdad de ese SQL. El servidor escucha en el puerto **3000**
(Supabase en la nube no se toca, se consulta). Para detenerlo, `Ctrl + C`.

## Endpoints

| Método | Ruta                   | Qué hace                                                        |
| ------ | ---------------------- | --------------------------------------------------------------- |
| GET    | `/requests`            | Lista las solicitudes. Filtros opcionales `?status=` y `?priority=` combinables; valor desconocido → `400`. |
| GET    | `/requests/:id`        | Consulta una solicitud (`200`) o `404 REQUEST_NOT_FOUND`.       |
| GET    | `/requests/:id/history`| La historia de estados de una solicitud (`200`) o `404`.        |
| POST   | `/requests`            | Crea una solicitud (`201`) con id, fechas, estado `open` **y su primera fila de historial** en la misma transacción; `400` si el título falta o la prioridad es desconocida. |
| PATCH  | `/requests/:id`        | Actualización parcial (`200`) con transiciones controladas; `409` si la regla lo impide; un cambio de estado deja también su evento en la historia. |

El contrato completo está en [`docs/http-contract.md`](docs/http-contract.md).

## Formato de error

Todos los fallos responden con la misma forma: `code` para los programas, `message` para
las personas. **Una falla de la base responde `503 DATABASE_UNAVAILABLE`, nunca un mensaje
de PostgreSQL con hosts o credenciales.**

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
├── package.json                 express + pg (no hay ORM)
├── scripts/
│   └── check-database.js        npm run db:check (sin exponer la URL)
├── database/
│   ├── migrations/
│   │   ├── 001_create_requests.sql
│   │   └── 002_create_request_status_history.sql
│   └── seed.sql
├── docs/
│   ├── data-model.md            diseño de datos (mismo que en ../data-model.md)
│   ├── http-contract.md
│   └── decisions/
│       ├── 001-cancel-instead-of-delete.md
│       └── 002-preserve-status-history.md
└── src/
    ├── app.js                   Express: JSON, rutas, errores de base centralizados
    ├── server.js                Abre el proceso
    ├── database/
    │   ├── pool.js              Pool compartido y traducción de errores de PostgreSQL
    │   └── transaction.js       BEGIN/COMMIT/ROLLBACK sobre un mismo cliente
    └── modules/
        └── requests/
            ├── requests.routes.js   Recibe HTTP y responde HTTP (handlers async)
            ├── requests.service.js  Existencia, transiciones, invariantes
            ├── requests.store.js    Solo SQL parametrizado y transacciones
            ├── request.mapper.js    Fila (snake_case) -> representación (camelCase)
            └── request-status.js    Estados, transiciones y reglas del ciclo de vida
```

## Responsabilidades

* **Ruta** → valida la forma, convierte ids, traduce el resultado a HTTP.
* **Service** → decide el dominio: `404` existe/no existe, `409` la regla de transición.
* **Store** → fila y transacción. El mismo SQL que se ejecuta en el SQL Editor.
* **Mapper** → un solo lugar donde la fila deja de ser la respuesta.
* **Pool** → una conexión compartida; la URL vive solo en `.env`.

## Datos persistentes

Al reiniciar Express los datos **permanecen**: viven fuera del proceso. La demostración
de la persistencia (el id creado sigue existiendo tras reiniciar) está en `../test-matrix.md`.

## Exclusión

Sin Docker ni PostgreSQL local (Supabase), sin ORM ni `supabase-js` (escapar el cliente
de la base por HTTP sería otro punto de acceso), sin scaffolding de tablas, sin `DELETE`,
sin `raw SQL` suelto desde el frontend. `DATABASE_URL` jamás llega al frontend (ni a este
README ni a un commit).