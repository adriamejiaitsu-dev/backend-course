# Casos de prueba manuales

Verificación manual de las dos APIs. Ambas escuchan en `http://localhost:3000`, así que se
prueban una a la vez (nunca quedan corriendo juntas). Todos los casos se ejecutaron con
`curl -i` para registrar la línea de estado, no solo el cuerpo.

Los outputs crudos completos quedaron guardados en:

- `lite-evidence-partA.txt` — API Lite **original** (Parte A)
- `lite-evidence-partB.txt` — API Lite **corregida** (Parte B)
- `full-evidence-partC.txt` — API Full (Parte C)

---

## Parte A — Request API Lite (original, tal como se entregó)

Arranque: `cd lite-api && npm install && node server.js` (esta es la versión previa a la
corrección, guardada en el historial con el tag `class-02-lite-analysis`).

| # | Petición | Resultado esperado (estado + cuerpo) | Resultado observado |
| - | -------- | ------------------------------------ | ------------------- |
| A1 | `GET /getRequests` | `200` + arreglo JSON con las solicitudes | `200` + arreglo con 3 solicitudes (ids 1–3) |
| A1b | `GET /requests` | `200` + arreglo JSON con las solicitudes | `404` + `Cannot GET /requests` |
| A2 | `GET /requests/1` | `200` + objeto de la solicitud 1 | `200` + objeto de la solicitud 1 |
| A3 | `GET /requests/999` | `404` + `{"error":"Request not found"}` | `200` + `{"error":"Request not found"}` |
| A4 | `POST /requests` con `title`, `description` y `priority` | `201` + objeto creado con `id` y `status: "open"` | `200` + `{"id":4,...,"status":"open"}` |
| A5 | `POST /requests` sin `title` | `400` + `{"error":"Title is required"}` y ningún dato guardado | `200` + `{"id":5,"description":"No title at all","status":"open","priority":"low"}` |
| A6 | `GET` de la colección después de A4 y A5 | `200` + la lista contiene la solicitud de A4 y no la de A5 | `200` + la lista contiene **ambas**: id 4 (con título) e id 5 (sin título) |

### Diferencias encontradas

| Fila | Defecto revelado |
| ---- | ---------------- |
| A1 vs A1b | El listado se expone como `GET /getRequests` (nombre con verbo) y no existe `GET /requests` (nombre del recurso). |
| A3 | `GET /requests/999` devuelve `200` con cuerpo de error: el estado contradice al cuerpo. Debería ser `404`. |
| A4 | La creación devuelve `200` en lugar de `201`: el cliente no puede distinguir una consulta de una creación solo con el estado. |
| A5 | Se acepta una creación sin `title` y se guarda una solicitud incompleta. Debería ser `400` sin guardar datos. |

---

## Parte B — Request API Lite corregida

Arranque: `cd lite-api && npm install && npm start` (versión corregida). Se repitieron
exactamente los mismos casos de la Parte A.

| # | Petición | Resultado esperado (estado + cuerpo) | Resultado observado |
| - | -------- | ------------------------------------ | ------------------- |
| B1 | `GET /requests` | `200` + arreglo JSON con las solicitudes | `200` + arreglo con 3 solicitudes |
| B2 | `GET /requests/1` | `200` + objeto de la solicitud 1 | `200` + objeto de la solicitud 1 |
| B3 | `GET /requests/999` | `404` + `{"error":"Request not found"}` | `404` + `{"error":"Request not found"}` ✓ |
| B4 | `POST /requests` con `title` válido | `201` + objeto creado | `201` + objeto creado (id 4) ✓ |
| B5 | `POST /requests` sin `title` | `400` + `{"error":"Title is required"}` | `400` + `{"error":"Title is required"}` ✓ |
| B6 | `GET /getRequests` | `404` (la ruta con verbo ya no existe) | `404` + `Cannot GET /getRequests` ✓ |

Todas las filas coinciden con lo esperado: las cuatro inconsistencias de la Parte A quedaron
corregidas y la evidencia es la misma serie de peticiones.

---

## Parte C — Request API Full

Arranque: `cd project && npm install && npm start`.

| # | Petición | Resultado esperado (estado + cuerpo) | Resultado observado |
| - | -------- | ------------------------------------ | ------------------- |
| C1 | `GET /requests` | `200` + arreglo JSON con las solicitudes | `200` + arreglo con 3 solicitudes |
| C1b | `GET /requests?status=open` | `200` + solo las solicitudes con `status: "open"` | `200` + 2 solicitudes (ids 1 y 3) ✓ |
| C2 | `GET /requests/2` | `200` + objeto de la solicitud 2 | `200` + objeto de la solicitud 2 |
| C3 | `GET /requests/999` | `404` + `{"error":"Request not found"}` | `404` + `{"error":"Request not found"}` |
| C4 | `POST /requests` con `title` válido | `201` + objeto creado con `id` nuevo y `status: "open"` | `201` + `{"id":4,...,"status":"open"}` |
| C5 | `POST /requests` con body `{}` | `400` + `{"error":"Title is required"}` | `400` + `{"error":"Title is required"}` |
| C6 | `POST /requests` con `title` en blanco (`"   "`) | `400` + `{"error":"Title is required"}` | `400` + `{"error":"Title is required"}` ✓ |
| C7 | `GET /requests` después de C4, C5 y C6 | `200` + la lista contiene solo la solicitud de C4 | `200` + la lista contiene las 3 iniciales y la id 4 (nada de C5/C6) ✓ |

### Estado de la verificación

- **¿Quedó alguna respuesta en `501`?** No. Los tres endpoints responden con los estados del
  contrato.
- **¿Alguna respuesta devolvió un estado distinto al esperado?** No. Todas las filas de la
  Parte C coinciden con `docs/http-contract.md`.