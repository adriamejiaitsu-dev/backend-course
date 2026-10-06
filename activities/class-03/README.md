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

## AI usage

Registro completo en [`ai-usage.md`](ai-usage.md). Resumen:

* **Honestidad de partida:** esta entrega se produjo con asistencia de IA de principio a fin,
  **incluido el diseño**. El tag `class-03-design` protege el orden diseño → código en el
  historial, no un trabajo redactado sin IA; la desviación está declarada en el archivo.
* **Aceptado:** los tres archivos del módulo (`requests.routes.js` / `requests.store.js` /
  `request-status.js`) y su separación de responsabilidades; `checkUpdate()` como única regla
  de transición; el orden de implementación por pasos con un commit verificable por fase; el
  middleware de JSON mal formado.
* **Rechazado o modificado:** `DELETE /requests/:id` (motivo completo en
  `project/docs/decisions/001-cancel-instead-of-delete.md`), las capas
  controllers/services/repositories, las librerías de validación, la persistencia, y los
  códigos propuestos `INVALID_JSON` e `INTERNAL_ERROR` para no editar la tabla de códigos
  del contrato después del tag.
* **Verificación:** 15 peticiones `curl` ejecutadas el 06/10/2026 cuyos resultados se
  transcribieron del log observado, no de la columna esperada; entre ellos la evidencia
  literal de `409 INVALID_STATUS_TRANSITION` y `409 REQUEST_IN_TERMINAL_STATUS`.

## Reflexión

Las ocho preguntas de cierre, cada una con su evidencia, están en
[`reflection.md`](reflection.md). La idea central: respecto de la clase 02 no cambiaron los
endpoints sino el *sistema* — un recurso con campos que decide el servidor, un contrato con
código por situación, una máquina de estados que protege el ciclo de vida y una matriz de
pruebas ejecutada antes de tocar el código. Quedan cuatro dudas abiertas documentadas al
final de `ai-usage.md` (`EMPTY_PATCH_BODY`, concurrencia en `PATCH`, campos desconocidos y
la frontera entre traducir y decidir en la ruta).
