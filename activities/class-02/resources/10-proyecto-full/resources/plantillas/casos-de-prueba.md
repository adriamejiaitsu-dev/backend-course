# Casos de prueba manuales

> Verificación manual de las dos APIs. Ambas escuchan en `http://localhost:3000`, así que
> **no puedes tenerlas corriendo a la vez**: prueba una, detén el servidor con `Ctrl + C` y
> prueba la otra.
>
> La columna **Resultado esperado** siempre describe lo que exige el contrato HTTP, no lo que
> hace el código. Por eso, en la API Lite original, las diferencias entre lo esperado y lo
> observado son exactamente los defectos que debes encontrar. En la Lite corregida y en la
> Full, todas las filas deben coincidir.
>
> Usa siempre `curl -i` para ver la línea de estado. Si prefieres solo el código de estado,
> añade `-o /dev/null -w "%{http_code}\n"`.

---

## Parte A — Request API Lite

Arranque:

```bash
cd request-api-lite
npm install
node server.js
```

### Comandos

```bash
# A1 · Listar solicitudes (ruta que expone el código de partida)
curl -i http://localhost:3000/getRequests

# A1b · Listar solicitudes por la ruta del recurso
curl -i http://localhost:3000/requests

# A2 · Consultar una solicitud existente
curl -i http://localhost:3000/requests/1

# A3 · Consultar una solicitud inexistente
curl -i http://localhost:3000/requests/999

# A4 · Crear una solicitud válida
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"Leaking faucet","description":"The faucet in the third floor bathroom leaks.","priority":"medium"}'

# A5 · Crear una solicitud sin título
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"description":"No title at all","priority":"low"}'

# A6 · Comprobar el efecto de A4 y A5 sobre los datos
curl -i http://localhost:3000/getRequests
```

### Registro

| # | Petición | Resultado esperado (estado + cuerpo) | Resultado observado |
| - | -------- | ------------------------------------ | ------------------- |
| A1 | `GET /getRequests` | `200` + arreglo JSON con las solicitudes | |
| A1b | `GET /requests` | `200` + arreglo JSON con las solicitudes | |
| A2 | `GET /requests/1` | `200` + objeto de la solicitud 1 | |
| A3 | `GET /requests/999` | `404` + `{"error":"Request not found"}` | |
| A4 | `POST /requests` con `title`, `description` y `priority` | `201` + objeto creado con `id` y `status: "open"` | |
| A5 | `POST /requests` sin `title` | `400` + `{"error":"Title is required"}` y ningún dato nuevo guardado | |
| A6 | `GET` de la colección después de A4 y A5 | `200` + la lista contiene la solicitud de A4 y **no** la de A5 | |

### Diferencias encontradas

Anota cada fila donde lo observado no coincida con lo esperado, y qué defecto revela.

_(Completar)_

---

## Parte B — Request API Lite corregida

Repite exactamente los mismos casos de la Parte A sobre tu versión corregida. Detén antes el
servidor anterior.

| # | Petición | Resultado esperado (estado + cuerpo) | Resultado observado |
| - | -------- | ------------------------------------ | ------------------- |
| B1 | `GET /requests` | `200` + arreglo JSON con las solicitudes | |
| B2 | `GET /requests/1` | `200` + objeto de la solicitud 1 | |
| B3 | `GET /requests/999` | `404` + `{"error":"Request not found"}` | |
| B4 | `POST /requests` con `title` válido | `201` + objeto creado | |
| B5 | `POST /requests` sin `title` | `400` + `{"error":"Title is required"}` | |
| B6 | `GET /getRequests` | `404` (la ruta con verbo ya no existe) | |

---

## Parte C — Request API Full

Arranque:

```bash
cd request-api-full
npm install
node src/server.js
```

### Comandos

```bash
# C1 · Listar solicitudes
curl -i http://localhost:3000/requests

# C2 · Consultar una solicitud existente
curl -i http://localhost:3000/requests/2

# C3 · Consultar una solicitud inexistente
curl -i http://localhost:3000/requests/999

# C4 · Crear una solicitud válida
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"Air conditioning is noisy","description":"Room 110 makes noise all morning.","priority":"low"}'

# C5 · Crear una solicitud sin título
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{}'

# C6 · Crear una solicitud con título en blanco
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"   "}'

# C7 · Comprobar el efecto de C4, C5 y C6 sobre los datos
curl -i http://localhost:3000/requests
```

### Registro

| # | Petición | Resultado esperado (estado + cuerpo) | Resultado observado |
| - | -------- | ------------------------------------ | ------------------- |
| C1 | `GET /requests` | `200` + arreglo JSON con las solicitudes | |
| C2 | `GET /requests/2` | `200` + objeto de la solicitud 2 | |
| C3 | `GET /requests/999` | `404` + `{"error":"Request not found"}` | |
| C4 | `POST /requests` con `title` válido | `201` + objeto creado con `id` nuevo y `status: "open"` | |
| C5 | `POST /requests` con body `{}` | `400` + `{"error":"Title is required"}` | |
| C6 | `POST /requests` con `title` en blanco | `400` + `{"error":"Title is required"}` | |
| C7 | `GET /requests` después de C4, C5 y C6 | `200` + la lista contiene solo la solicitud de C4 | |

### Estado de la verificación

* ¿Quedó alguna respuesta en `501`? Si es así, ¿cuál endpoint falta implementar?
* ¿Alguna respuesta devolvió un estado distinto al esperado? ¿Cuál y por qué?

_(Completar)_
