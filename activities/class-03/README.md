# Entrega 03 — Recursos, estado y reglas

Actividad de la clase 03 de **Desarrollo Backend** (ITSU). Pasa de endpoints sueltos a una
API coherente: un modelo, un contrato y reglas que protegen el sistema.

## Qué hay en esta carpeta

| Archivo               | Fase | Contenido                                                             |
| --------------------- | ---- | --------------------------------------------------------------------- |
| `resource-model.md`   | 1    | El recurso `request`: propiedades, campos del servidor, reglas, dudas. |
| `http-contract.md`    | 1    | Los cuatro endpoints con intención, body, errores y ejemplos.         |
| `transition-map.md`   | 1    | Estados, transiciones permitidas, terminales y su justificación.      |
| `test-matrix.md`      | 1+5  | Casos esperados (fase 1) y resultados observados con `curl` (fase 5). |
| `ai-usage.md`         | 3    | Registro honesto del uso de la IA: lo aceptado y lo rechazado.        |
| `reflection.md`       | 5    | Las ocho preguntas de cierre con evidencia.                           |
| `project/`            | 2    | El proyecto transversal implementado sobre este diseño.               |

## El proyecto

```txt
project/
├── README.md
├── package.json
├── docs/
│   ├── http-contract.md
│   └── decisions/
│       └── 001-cancel-instead-of-delete.md
└── src/
    ├── app.js
    ├── server.js
    └── modules/
        └── requests/
            ├── requests.routes.js
            ├── requests.store.js
            └── request-status.js
```

Ejecutar:

```bash
cd project
npm install
npm start
```

## Historial

| Momento            | Marca                    |
| ------------------ | ------------------------ |
| Diseño guardado    | tag `class-03-design`    |
| Entrega completada | tag `class-03-submission`|

Recorrido de los commits: diseño → migración de estructura sin cambiar comportamiento →
`request-status.js` → contrato de creación → `PATCH` con 409 → filtros → formato de error
unificado → uso de IA → decisión 001 → matriz ejecutada → reflexión.

## Verificación

15 peticiones `curl` ejecutadas el 06/10/2026 contra el servidor corriendo: los 8 casos base
y los 6 propios de `test-matrix.md` coincidieron con lo esperado, incluida la evidencia
literal de `409 INVALID_STATUS_TRANSITION` y `409 REQUEST_IN_TERMINAL_STATUS`. Para repetir:

```bash
cd project
npm start
# en otra terminal, cada caso de la matriz con curl -i
```

## Alcance y exclusiones

Cuatro endpoints (`GET /requests`, `GET /requests/:id`, `POST /requests`,
`PATCH /requests/:id`), datos en memoria. Sin base de datos ni persistencia en archivo, sin
`DELETE`, sin librerías de validación, sin autenticación, sin capas
controllers/services/repositories, sin dependencias además de Express y sin frontend.
