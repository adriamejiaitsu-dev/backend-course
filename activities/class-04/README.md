# Entrega 04 — De SQL al backend persistente

Actividad de la clase 04 de **Desarrollo Backend** (ITSU). El proyecto de la clase 03 deja
la memoria de proceso (los datos mueren con el servidor) para que el sistema duerma en
PostgreSQL (Supabase) y las reglas tomen una segunda línea de defensa en la base.

## Qué hay en esta carpeta

| Archivo                     | Fase | Contenido                                                     |
| --------------------------- | ---- | ------------------------------------------------------------- |
| `data-model.md`             | 1    | Tablas `requests` y `request_status_history`, qué protege cada una y dudas. |
| `persistence-contract.md`   | 1    | Las cinco operaciones de persistencia y su traductor a la base. |
| `query-matrix.md`           | 1    | Las nueve operaciones SQL con parámetros y la verificación de seguridad. |
| `transaction-plan.md`       | 1    | ¿Cuándo es transacción? Unidad de creación y de cambio de estado. |
| `error-map.md`              | 1    | Categorías de fallo (contrato/recurso/dominio/persistencia/infraestructura) y política de log sin secretos. |
| `test-matrix.md`            | 1+6  | Casos esperados (fase 1) y resultados observados (fase 6).     |
| `ai-usage.md`               | 4    | Registro honesto del uso de la IA.                             |
| `reflection.md`             | 6    | Las doce preguntas del ticket de salida con evidencia.         |
| `project/`                  | 2-5  | El proyecto transversal implementado sobre este diseño.        |

## El proyecto

```txt
project/
├── README.md
├── package.json                  express + pg (no hay ORM)
├── .env.example                  -> .env (DATABASE_URL; jamás en git)
├── scripts/check-database.js     npm run db:check
├── database/
│   ├── migrations/001_create_requests.sql
│   ├── migrations/002_create_request_status_history.sql
│   └── seed.sql
├── docs/
│   ├── data-model.md
│   ├── http-contract.md
│   └── decisions/001-cancel-instead-of-delete.md y 002-preserve-status-history.md
└── src/
    ├── app.js                    errores de base centralizados (503, sin fugas)
    ├── server.js
    ├── database/pool.js          pool + traducción de errores de PostgreSQL
    ├── database/transaction.js   BEGIN/COMMIT/ROLLBACK del mismo cliente
    └── modules/requests/
        ├── requests.routes.js    HTTP: validación de forma y traducción a estado
        ├── requests.service.js   dominio: existencia, transiciones, invariantes
        ├── requests.store.js     solo SQL parametrizado y transacciones
        ├── request.mapper.js     fila (snake_case) -> representación (camelCase)
        └── request-status.js     estados, transiciones y reglas del ciclo de vida
```

Ejecutar:

```bash
cd project
npm install
copy .env.example .env   # pegar la DATABASE_URL (Session pooler, puerto 5432)
npm run db:check         # conexión + esquema
npm start
```

Las migraciones y el `seed.sql` se aplican en el SQL Editor de Supabase; este repositorio
es la fuente de verdad de ese SQL (en esta máquina, sin `psql` ni Docker, se aplicaron con
un runner local que lee los mismos archivos de `database/`).

## Historial

| Momento            | Marca                    |
| ------------------ | ------------------------ |
| Diseño guardado    | tag `class-04-design`    |
| Entrega completada | tag `class-04-submission`|

Recorrido de los commits: diseño → base de código (pool, transacciones, store SQL,
contrato v4) → configuración y migraciones aplicadas a Supabase → matriz ejecutada →
decisión 002 → uso de IA → reflexión.

## Verificación

La matriz fue **ejecutada**, no copiada: 15 casos observados (11 de la plantilla + 4
propios) con el servidor corriendo, y las evidencias clave son literales — el `201` con su
`id` sobreviviendo al reinicio (`GET /requests/5` con los mismos instantes) y el rollback
con el `INSERT` de historia rechazado por el `CHECK` (`SQLSTATE 23514`) dejando `requests`
intacto. Casos destacados:

* `404 REQUEST_NOT_FOUND` para id inexistente **y** para id no numérico (contrato v3 intacto).
* `409 INVALID_STATUS_TRANSITION` con cero escrituras (`updatedAt` sin cambio, historial sin
  evento nuevo).
* `503 DATABASE_UNAVAILABLE` con URL rota y el proceso siguiendo vivo; el cuerpo nunca
  expone el mensaje crudo de PostgreSQL.

## Alcance y exclusiones

Cinco endpoints (`GET /requests`, `GET /requests/:id`, `GET /requests/:id/history`,
`POST /requests`, `PATCH /requests/:id`), datos persistentes en Supabase. Sin Docker ni
PostgreSQL local (exclusión de la entrega), sin ORM ni `supabase-js` desde el frontend,
sin `DELETE`, sin `raw SQL` suelto desde el cliente, sin librerías de validación, sin
autenticación. La `DATABASE_URL` vive solo en `.env` (ignorado por git, verificado con
`git check-ignore`) y nunca llega a un commit, captura o chat.

## AI usage

Registro completo en [`ai-usage.md`](ai-usage.md). Resumen:

* **Honestidad de partida:** esta entrega se produjo con asistencia de IA de principio a
  fin, **incluido el diseño**. El tag `class-04-design` protege el orden diseño → código en
  el historial, no un trabajo redactado sin IA; la desviación está declarada en el archivo.
* **Aceptado:** la separación ruta/service/store/mapper; los `INSERT` + evento de historia
  dentro de una misma transacción; el pool compartido con un único punto de traducción de
  errores de PostgreSQL; los `CHECK` y la `FOREIGN KEY` del historial.
* **Rechazado o corregido en el camino:** `400 INVALID_REQUEST_ID` para ids no numéricos
  (se reemplazó por `404` para mantener el contrato v3 intacto), ORM, `supabase-js`,
  triggers, `ON DELETE CASCADE`, y el propria `translate()` que en el caso C19 dejaba
  escapar el host de la URL en el mensaje (se corrigió con la clasificación de errno de OS
  y el paso a través solo de errores nuestros con `status`).
* **Verificación:** matriz ejecutada el 08/10/2026; las observaciones se transcribieron
  del log real (HTTP + body) y las evidencias de persistencia y rollback citan las líneas
  literales.

## Reflexión

Las doce preguntas del ticket de salida, cada una con su evidencia, están en
[`reflection.md`](reflection.md). La idea central: respecto de la clase 03 no cambiaron los
endpoints sino dónde vive la verdad — las reglas se defendieron en la base y en la
aplicación, cada cambio de estado quedó como un hecho con su explicación, y el problema
que queda abierto (la concurrencia de dos escrituras sobre la misma solicitud) es
justamente el que una transacción por sí sola no resuelve.