# backend-course

Repositorio individual de **Adrian Mejia** ([@adriamejiaitsu-dev](https://github.com/adriamejiaitsu-dev))
para la materia **Desarrollo Backend** (ITSU) — *Backend: fundamentos, arquitectura y criterio técnico*.

Aquí vive el progreso real del trimestre: una carpeta por clase dentro de `activities/`,
con la solución, la evidencia reproducible, la explicación conceptual, la sección `AI usage`
y la reflexión de cada entrega. El foco del curso no es memorizar framework sino comprender
qué ocurre detrás de una aplicación web: recorrido de una petición, HTTP, contratos,
persistencia, permisos, diagnóstico y arquitectura.

## Índice de actividades

| Clase | Pregunta central | Carpeta | Estado |
| --- | --- | --- | --- |
| [01](https://html-css-js-course-wheat.vercel.app/materias/desarrollo-backend/clases/class-01/) | ¿Qué ocurre detrás de una aplicación? | [`activities/class-01/`](activities/class-01/) | ✅ tag `class-01-submission` |
| [02](https://html-css-js-course-wheat.vercel.app/materias/desarrollo-backend/clases/class-02/) | ¿Cómo se comunican cliente y servidor? | [`activities/class-02/`](activities/class-02/) | ✅ tags `class-02-lite-analysis`, `class-02-submission` |
| [03](https://html-css-js-course-wheat.vercel.app/materias/desarrollo-backend/clases/class-03/) | ¿Cómo diseñamos una API predecible? | [`activities/class-03/`](activities/class-03/) | ✅ tags `class-03-design`, `class-03-submission` |
| 04 | ¿Cómo permanece la información? | — | ⬜ pendiente |
| 05 | ¿Quién puede ejecutar cada operación? | — | ⬜ pendiente |
| 06 | ¿Cómo se trabaja sobre un backend que no escribiste tú? | — | ⬜ pendiente |
| [07](https://html-css-js-course-wheat.vercel.app/materias/desarrollo-backend/clases/class-07/) | ¿Qué ocurrió cuando el backend falla? | [`activities/class-07/`](activities/class-07/) | ✅ tag `class-07-submission` |
| [08](https://html-css-js-course-wheat.vercel.app/materias/desarrollo-backend/clases/class-08/) | ¿Cómo reorganizar sin cambiar el comportamiento? | [`activities/class-08/`](activities/class-08/) | ⚠️ tag `class-08-submission`; faltan los archivos del checkpoint 1-7 |
| 09 | ¿Cómo sabemos que el sistema funciona? | — | ⬜ pendiente |
| 10 | ¿Qué arquitectura necesita este problema? | — | ⬜ pendiente |
| 11 | ¿Puedo defender las decisiones del sistema? | — | ⬜ pendiente |

## Proyecto transversal

El sistema de gestión de solicitudes crece clase a clase: cada sesión añade una capacidad
y una decisión. Los proyectos viven dentro de la carpeta de su clase (cada uno es único):

* [`activities/class-02/project/`](activities/class-02/project/) — API Full con los tres endpoints
  y `docs/http-contract.md`.
* [`activities/class-03/project/`](activities/class-03/project/) — cuatro endpoints, máquina de
  estados con 409, filtros y `docs/decisions/001-cancel-instead-of-delete.md`.
* [`activities/class-07/project/`](activities/class-07/project/) — manejo central de errores,
  request ID, logs estructurados, `/health` y `/ready`.
* [`activities/class-08/`](activities/class-08/) — refactor del historial y FEATURE-801
  (`POST /requests/:id/claim`).

La carpeta raíz [`project/`](project/) queda reservada para el **proyecto final integrado**
(pendiente), con `src/`, `tests/` y `docs/architecture/` (registro de decisiones).

## Instrucciones de ejecución

Requisitos: [Node.js](https://nodejs.org) 20 o superior, npm y Git.

```bash
git clone https://github.com/adriamejiaitsu-dev/backend-course.git
cd backend-course
```

Cada clase se ejecuta desde su carpeta:

```bash
# Clase 01 — servidor HTTP nativo, sin dependencias
cd activities/class-01 && node src/server.js          # http://localhost:3000

# Clase 02 — Lite (versión de partida) y Full
cd activities/class-02/lite-api  && npm install && node server.js
cd activities/class-02/project   && npm install && npm start

# Clase 03 — API con máquina de estados
cd activities/class-03/project && npm install && npm start

# Clase 07 — guardia de mantenimiento
cd activities/class-07/project
cp .env.example .env        # DATABASE_URL y JWT_SECRET locales (nunca se suben)
npm install && npm test && npm run validate:class-07

# Clase 08 — taller de arquitectura
cd activities/class-08
cp .env.example .env
npm install && npm run class-08:doctor && npm test && npm run validate:class-08
```

La evidencia de cada verificación está guardada en la carpeta de su clase
(`lite-evidence-*.txt`, `full-evidence-partC.txt`, `casos-de-prueba.md`, `test-matrix.md`,
`validation-evidence.txt`), de modo que los resultados pueden reproducirse.

## Estructura del repositorio

```txt
backend-course/
├── README.md                 ← este archivo
├── activities/
│   ├── class-01/             ← README + src/ (servidor HTTP nativo)
│   ├── class-02/             ← análisis, Lite, proyecto Full, comparación, AI usage
│   ├── class-03/             ← diseño, matriz de pruebas, proyecto, reflexión
│   ├── class-07/             ← incident report, evidencia, ticket, proyecto
│   └── class-08/             ← mapa, refactor log, evidencias, proyecto del taller
├── project/                  ← proyecto final integrado (pendiente)
└── resources-notes/          ← notas y recursos de consulta
```

## Estado de entregas

| Entrega | Tag | Commit | Notas |
| --- | --- | --- | --- |
| Entrega 01 | `class-01-submission` | `6685df9` | Servidor con `/`, `/health`, `/api/info` y 404; 6 fallas diagnosticadas. |
| Entrega 02 | `class-02-lite-analysis` | `4e997a5` | Análisis del Lite hecho antes de usar IA. |
| Entrega 02 | `class-02-submission` | `d569280` | Lite corregido + contrato + proyecto Full + comparación. |
| Diseño 03 | `class-03-design` | `224ad75` | Modelo, contrato, máquina de estados y matriz antes del código. |
| Entrega 03 | `class-03-submission` | `9becf7a` | 4 endpoints, 15 peticiones `curl` verificadas. |
| Entrega 07 | `class-07-submission` | `18bb9de` | INC-701, INC-702 y OPS-703 con validador en PASSED. |
| Entrega 08 | `class-08-submission` | `3bbc3cc` | Refactor + FEATURE-801. **Pendiente:** completar `course-progress-evidence-01-07.md`, `ai-self-evaluation-01-07.md` y `ai-knowledge-exam-01-07.md`. |
| Entregas 04, 05, 06, 09, 10, 11 | — | — | ⬜ pendientes |

## Uso de IA

La IA está permitida como herramienta de consulta y contraste, no como sustituto de la
comprensión: hay que poder explicar, probar y defender todo lo que se suba. Cada entrega
documenta su uso en la sección `AI usage` de su README
([01](activities/class-01/README.md) ·
[02](activities/class-02/README.md) ·
[03](activities/class-03/README.md) ·
[07](activities/class-07/README.md) ·
[08](activities/class-08/README.md)),
con lo aceptado, lo rechazado y cómo se verificó el resultado.

## Reglas que respeta este repositorio

* Un solo repositorio para toda la materia, con entregas progresivas (no una carga masiva).
* Historial con commits descriptivos; **sin reescribir el historial ni `force push`**.
* Los tags originales de entrega se conservan aunque se corrija después.
* `.env`, tokens y `node_modules/` jamás se suben (`.gitignore` lo garantiza).
* La colaboración se declara; la explicación y la entrega son individuales.

---

📚 [Materia Desarrollo Backend](https://html-css-js-course-wheat.vercel.app/materias/desarrollo-backend/index.html) · ITSU · © 2026
