# course-progress-evidence-01-07

Paquete de evidencia para el diagnóstico acumulativo 7 en 1.
Generado automáticamente — completa las secciones marcadas con [COMPLETAR] antes de ejecutar el prompt.

## Metadata

* studentId: [COMPLETAR — tu identificador de estudiante, sin datos personales extra]
* promptVersion: ITSU-CHECKPOINT-01-07-1.0
* rubricVersion: BACKEND-01-07-R1
* generatedAt: 2026-10-06T15:51:48.156Z (EXECUTED_NOW)
* repoRoot: backend-course
* commit: cd95b7d (EXECUTED_NOW)
* repositorioRemoto: https://github.com/adriamejiaitsu-dev/backend-course.git (EXECUTED_NOW) — verifica que sea TU repositorio antes de continuar
* modeloUtilizado: [COMPLETAR después de ejecutar el prompt]

### Contexto de git (informativo, EXECUTED_NOW)

El curso se trabaja en computadoras compartidas: el historial local puede
estar incompleto o pertenecer a otra sesión sin que falte trabajo real.
Este contexto NO es evidencia requerida — la evidencia son los archivos
del repositorio remoto del estudiante y sus respuestas. La ausencia de
commits aquí no debe interpretarse como evidencia faltante.

```text
cd95b7d class-01: eliminar carpeta duplicada 'class 01' y readme.txt vacio
81332e5 class-02: eliminar copias del material del sitio (resources, recursos)
9becf7a Entrega clase 03
41dc72f Reflexion de la entrega con evidencia de la matriz (fase 5)
41d7413 Matriz de pruebas ejecutada con curl: resultados observados (fase 5)
ce5f3d0 Nota de decision 001: cancelar en vez de borrar (fase 4)
93fe303 Registro honesto de uso de IA (fase 3)
523af9d Formato de error unificado { code, message } y 404 de ruta
```

## Evidencia por clase

Los archivos listados existen en el repositorio (FOUND). Un archivo de salida guardado, como validation-evidence.txt, es TEXTO: demuestra que se guardó, no que se ejecutó (NOT_VERIFIED como ejecución).

### Clase 01 — Fundamentos de backend

* FOUND: activities\class-01\README.md
* FOUND: activities\class-01\src\server.js

Extracto de activities\class-01\README.md (redactado automáticamente):

```text
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
[... 236 líneas más]
```

### Clase 02 — HTTP y contratos

* FOUND: activities\class-02\.gitignore
* FOUND: activities\class-02\README.md
* FOUND: activities\class-02\ai-usage.md
* FOUND: activities\class-02\casos-de-prueba.md
* FOUND: activities\class-02\comparison.md
* FOUND: activities\class-02\complementos\actividad-comparativa-protocolos.md
* FOUND: activities\class-02\complementos\ticket-de-salida.md
* FOUND: activities\class-02\full-evidence-partC.txt — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities\class-02\lite-analysis.md
* FOUND: activities\class-02\lite-api\README.md
* FOUND: activities\class-02\lite-api\package-lock.json
* FOUND: activities\class-02\lite-api\package.json
* … 13 archivo(s) más con el mismo patrón

Extracto de activities\class-02\project\docs\http-contract.md (redactado automáticamente):

```text
# Contrato HTTP — Request API Full

> Contrato definido **antes** de implementar los manejadores. Es la promesa de la API; el
> código de `src/` es la manera de cumplirla.

## Recurso

Una **solicitud** (`request`) representa un pedido de mantenimiento registrado por un usuario.
El sistema guarda un título breve, una descripción, un nivel de prioridad y el estado del
trámite. Las solicitudes viven en memoria: se pierden cada vez que se reinicia el servidor.

### Forma del recurso

| Campo         | Tipo   | Obligatorio | Quién lo asigna | Notas |
| ------------- | ------ | ----------- | --------------- | ----- |
| `id`          | number | Sí          | Servidor        | Identificador único, generado por el servidor |
| `title`       | string | Sí          | Cliente         | Se rechaza si falta o es solo espacios |
| `description` | string | No          | Cliente         | Opcional, se omite si no se envía |
| `status`      | string | Sí          | Servidor        | Siempre `"open"` al crear |
| `priority`    | string | No          | Cliente         | Opcional |

---

## Endpoint 1 — Listar solicitudes

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `GET` |
| Ruta                  | `/requests` |
| Entrada               | Opcional: query parameter `status` para filtrar por estado |
[... 86 líneas más]
```

Extracto de activities\class-02\README.md (redactado automáticamente):

```text
# Clase 02 · HTTP: el contrato entre cliente y servidor

Entrega 02 de Desarrollo Backend. Hay **dos proyectos sobre el mismo recurso** (solicitudes
de mantenimiento): el **Lite** enseña a leer y corregir un contrato ajeno; el **Full**, a
definir un contrato antes de que exista el código. Vence antes del inicio de la clase 3.

## Qué contiene esta carpeta

```txt
activities/class-02/
├── README.md                ← este archivo
├── .gitignore
├── lite-api/                ← API Lite: original (en el historial) + corregida
├── lite-analysis.md         ← análisis de la API Lite con evidencia
├── casos-de-prueba.md       ← casos A/B/C con resultados observados
├── project/                 ← API Full (contrato + código + datos)
├── comparison.md            ← comparación Lite vs Full + reflexión
├── ai-usage.md              ← registro del uso de IA
├── complementos/            ← ticket de salida y actividad comparativa de protocolos
├── lite-evidence-partA.txt  ← outputs crudos de los casos de la Lite original
├── lite-evidence-partB.txt  ← outputs crudos de los casos de la Lite corregida
├── full-evidence-partC.txt  ← outputs crudos de los casos del Full
├── recursos/                ← archivos descargados de la presentación (plantillas, starter)
└── resources/               ← manifests y láminas de los 11 bloques de la clase
```

Los tags de entrega en el historial:

- `class-02-lite-analysis` — el punto donde quedó el análisis de la Lite **antes de** las
  correcciones.
[... 60 líneas más]
```

### Clase 03 — Recursos, estado y reglas

* FOUND: activities\class-03\README.md
* FOUND: activities\class-03\ai-usage.md
* FOUND: activities\class-03\http-contract.md
* FOUND: activities\class-03\project\README.md
* FOUND: activities\class-03\project\docs\decisions\001-cancel-instead-of-delete.md
* FOUND: activities\class-03\project\docs\http-contract.md
* FOUND: activities\class-03\project\package-lock.json
* FOUND: activities\class-03\project\package.json
* FOUND: activities\class-03\project\src\app.js
* FOUND: activities\class-03\project\src\modules\requests\request-status.js
* FOUND: activities\class-03\project\src\modules\requests\requests.routes.js
* FOUND: activities\class-03\project\src\modules\requests\requests.store.js
* … 5 archivo(s) más con el mismo patrón

Extracto de activities\class-03\resource-model.md (redactado automáticamente):

```text
# Resource model — Request

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> No toda palabra del requerimiento se convierte en ruta o campo: parte del trabajo es
> decidir qué entra, qué espera y qué se pregunta.

## Nombre del recurso

**Request** (`request`): una solicitud de mantenimiento registrada por alguien que reporta un
problema (un proyector que no enciende, una silla rota, el Wi-Fi inestable). El sistema la
recibe, la mantiene en cola de atención y la acompaña hasta que se resuelve, se confirma o se
interrumpe. Vive en memoria: se pierde al reiniciar el servidor.

## Propiedades

| Propiedad     | Tipo   | Ejemplo                         |
| ------------- | ------ | ------------------------------- |
| `id`          | number | `1`                             |
| `title`       | string | `"Projector does not turn on"`  |
| `description` | string | `"Room 204 shows no image."`    |
| `status`      | string | `"open"`                        |
| `priority`    | string | `"high"`                        |
| `createdAt`   | string | `"2026-10-06T14:03:11.208Z"`    |
| `updatedAt`   | string | `"2026-10-06T14:05:47.911Z"`    |

## Campos requeridos

* `title` — sin título no hay solicitud: es lo que le da sentido al registro y lo que lee
  quien atiende. Se acepta solo si es texto y, una vez recortado, no queda vacío.

[... 62 líneas más]
```

Extracto de activities\class-03\README.md (redactado automáticamente):

```text
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
[... 45 líneas más]
```

### Clase 04 — PostgreSQL y persistencia

* FOUND: activities\class-07\project\scripts\seed.js
* FOUND: activities\class-08\scripts\seed.js

### Clase 05 — Autenticación y autorización

* NOT_FOUND: ningún artefacto esperado de esta clase

### Clase 06 — Onboarding y pruebas

* FOUND: activities\class-07\project\scripts\validate-class-06.js
* FOUND: activities\class-08\scripts\validate-class-06.js

### Clase 07 — Diagnóstico y errores

* FOUND: activities\class-07\README.md
* FOUND: activities\class-07\incident-report.md
* FOUND: activities\class-07\project\.gitignore
* FOUND: activities\class-07\project\README.md
* FOUND: activities\class-07\project\database\migrations\001_create_users.sql
* FOUND: activities\class-07\project\database\migrations\002_create_requests.sql
* FOUND: activities\class-07\project\database\migrations\003_create_request_history.sql
* FOUND: activities\class-07\project\database\migrations\004_add_constraints_and_indexes.sql
* FOUND: activities\class-07\project\incidents\INC-701-invalid-request-id.md
* FOUND: activities\class-07\project\incidents\INC-702-invalid-priority.md
* FOUND: activities\class-07\project\incidents\OPS-703-untraceable-errors.md
* FOUND: activities\class-07\project\package-lock.json
* … 52 archivo(s) más con el mismo patrón

Extracto de activities\class-07\incident-report.md (redactado automáticamente):

```text
# Class 07 incident report

Completado MIENTRAS se investigaba. Hechos separados de interpretaciones;
las hipótesis viven en Hypotheses, no en Evidence.

## Baseline

Which command confirmed the starting state?

- `npm run class-07:doctor` -> 7/7 PASS, "Environment ready for incident response."
- `npm run db:migrate` -> 4 migraciones APPLIED (base local que simula Supabase de clase 06).
- `npm run db:seed` -> 2 requesters + 1 agent, 6 requests, 15 history events.
- `npm test` -> 20 pass / 17 todo / 0 fail (las 17 TODO son las pruebas a escribir).

## Incident 701

### Report

Soporte reporta que "some request identifiers return an internal server error":
un integrador construye enlaces hacia solicitudes y algunos responden 500.

### Reproduction

```
GET /requests/not-a-number
Authorization: Bearer <token de ana (requester)>
```

### Expected result

[... 186 líneas más]
```

Extracto de activities\class-07\validation-evidence.txt (redactado automáticamente):

```text
﻿
> class-07-request-api@7.0.0 validate:class-07
> node scripts/validate-class-07.js

CLASS 07 INCIDENT VALIDATION

Baseline
[01/12] Existing contract preserved .......... PASS

Input and errors
[02/12] Invalid id returns 400 ............... PASS
[03/12] Invalid priority returns 400 ......... PASS
[04/12] Unknown request returns 404 .......... PASS
[05/12] Invalid transition returns 409 ....... PASS
[06/12] Unexpected errors return 500 ......... PASS
[07/12] Internal details remain hidden ....... PASS

Traceability
[08/12] Response contains request id ......... PASS
[09/12] Log contains the same request id ..... PASS
[10/12] Authorization header is not logged ... PASS

Operation
[11/12] Health endpoint responds ............. PASS
[12/12] Readiness checks PostgreSQL .......... PASS

Cleanup
Temporary validation data removed successfully.

FINAL RESULT: PASSED
[... 1 líneas más]
```

## Estado previo a la clase 8

* Validadores disponibles (clases 1-7): activities\class-07\project\scripts\validate-class-06.js, activities\class-07\project\scripts\validate-class-07.js, activities\class-08\scripts\validate-class-06.js, activities\class-08\scripts\validate-class-07.js
* Carpetas de pruebas: NOT_FOUND
* Último commit antes del taller: cd95b7d

## Cuestionario diagnóstico (responde aquí, 3-6 líneas cada una)

Sé específico: cita archivos o rutas concretas de TU proyecto cuando puedas. La extensión no suma.

### Pregunta clase 01

Describe qué ocurre desde que una petición llega al backend hasta que sale una respuesta y explica por qué el servidor debe permanecer activo.

Respuesta: [COMPLETAR]

### Pregunta clase 02

Elige un endpoint del proyecto y explica cómo método, ruta, body y status forman su contrato.

Respuesta: [COMPLETAR]

### Pregunta clase 03

Explica, usando una solicitud del proyecto, la diferencia entre representación, dato inválido y transición incompatible con el estado actual.

Respuesta: [COMPLETAR]

### Pregunta clase 04

Explica la diferencia entre migración, seed y transacción, e indica dónde aparece cada concepto en el proyecto.

Respuesta: [COMPLETAR]

### Pregunta clase 05

Explica la diferencia entre autenticación y autorización y por qué un JWT decodificado todavía debe verificarse.

Respuesta: [COMPLETAR]

### Pregunta clase 06

Elige una prueba del proyecto, identifica preparación, acción y comprobación, y explica qué regresión protege.

Respuesta: [COMPLETAR]

### Pregunta clase 07

Describe un fallo investigado distinguiendo síntoma, hipótesis y causa; luego indica qué señal correspondería a health o readiness.

Respuesta: [COMPLETAR]

---
Nota de seguridad: este paquete fue generado excluyendo .env y redactando
posibles secretos. Revisa una vez más antes de pegarlo en un modelo:
si ves una credencial real, reemplázala por [REDACTED] y avisa al docente.
