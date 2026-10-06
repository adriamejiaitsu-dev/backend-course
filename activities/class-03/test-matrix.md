# Test matrix — Entrega 03

> Fase 1: se declara el resultado **esperado**. Fase 5: se ejecuta cada caso con `curl`
> contra el proyecto corriendo y se registra el resultado **observado** (línea de estado
> literal y cuerpo). La columna observado se llena ejecutando, no copiando la esperada.

Orden de ejecución: los casos 1 a 4 y los propios corren contra el servidor recién arrancado;
los casos 5 a 8 encadenan la misma solicitud (`id: 1`) y por eso se listan en este orden. Si
se quiere repetir un caso en solitario, basta con reiniciar el servidor: los datos viven en
memoria. Ejecutado el **06/10/2026** con `node src/server.js` en el puerto 3000.

| Caso                   | Petición                      | Estado previo | Resultado esperado | Resultado observado |
| ---------------------- | ----------------------------- | ------------- | ------------------ | ------------------- |
| Crear correctamente    | `POST /requests`              | —             | `201`              | `HTTP/1.1 201 Created` — `{"id":4,...,"status":"open","priority":"low","createdAt":"2026-10-06T15:01:51.319Z","updatedAt":"2026-10-06T15:01:51.319Z"}` |
| Crear sin título       | `POST /requests`              | —             | `400`              | `HTTP/1.1 400 Bad Request` — `{"error":{"code":"TITLE_REQUIRED","message":"Title is required"}}` |
| Consultar inexistente  | `GET /requests/999`           | —             | `404`              | `HTTP/1.1 404 Not Found` — `{"error":{"code":"REQUEST_NOT_FOUND","message":"Request 999 not found"}}` |
| Filtrar sin resultados | `GET /requests?status=closed` | —             | `200 []`           | `HTTP/1.1 200 OK` — `[]` |
| Cambiar prioridad      | `PATCH /requests/1`           | `open`        | `200`              | `HTTP/1.1 200 OK` — `{"id":1,...,"status":"open","priority":"medium","updatedAt":"2026-10-06T15:01:51.754Z"}` |
| Transición válida      | `PATCH /requests/1`           | `open`        | `200`              | `HTTP/1.1 200 OK` — `{"id":1,...,"status":"in_progress",...}` |
| Transición inválida    | `PATCH /requests/1`           | `open`        | `409`              | `HTTP/1.1 409 Conflict` — `{"error":{"code":"INVALID_STATUS_TRANSITION","message":"Cannot move a request from \"open\" to \"closed\""}}` |
| Modificar cerrada      | `PATCH /requests/1`           | `closed`      | `409`              | `HTTP/1.1 409 Conflict` — `{"error":{"code":"REQUEST_IN_TERMINAL_STATUS","message":"Request in terminal status \"closed\" cannot be modified"}}` |

> Agrega tus propios casos debajo (mínimo dos): por ejemplo, filtro con valor desconocido,
> body sin campos modificables, o el campo `status` enviado al crear.

| Caso | Petición | Estado previo | Resultado esperado | Resultado observado |
| ---- | -------- | ------------- | ------------------ | ------------------- |
| Filtro con valor desconocido | `GET /requests?status=abierta` | — | `400 INVALID_FILTER_VALUE` | `HTTP/1.1 400 Bad Request` — `{"error":{"code":"INVALID_FILTER_VALUE","message":"Unknown status value \"abierta\""}}` |
| Body sin campos modificables | `PATCH /requests/1` con `{}` | `open` | `400 EMPTY_PATCH_BODY` | `HTTP/1.1 400 Bad Request` — `{"error":{"code":"EMPTY_PATCH_BODY","message":"Patch body requires at least one of: title, description, priority, status"}}` |
| `status` enviado al crear | `POST /requests` con `"status": "closed"` | — | `201` con `status: "open"` | `HTTP/1.1 201 Created` — `{"id":5,"title":"Leaking faucet","status":"open",...}` (el `status` y el `id` del cliente se ignoraron) |
| `priority` desconocida al crear | `POST /requests` con `"priority": "urgent"` | — | `400 INVALID_PRIORITY_VALUE` | `HTTP/1.1 400 Bad Request` — `{"error":{"code":"INVALID_PRIORITY_VALUE","message":"Unknown priority value \"urgent\""}}` |
| Transición válida a terminal | `PATCH /requests/1` con `{"status":"closed"}` | `resolved` | `200` con `status: "closed"` | `HTTP/1.1 200 OK` — `{"id":1,...,"status":"closed",...}` |
| `status` desconocido en PATCH | `PATCH /requests/1` con `{"status":"cerrada"}` | `open` | `400 INVALID_STATUS_VALUE` | `HTTP/1.1 400 Bad Request` — `{"error":{"code":"INVALID_STATUS_VALUE","message":"Unknown status value \"cerrada\""}}` |

## Evidencia

_(Pega aquí las salidas de `curl -i` de al menos los casos de transición inválida y de
solicitud terminal: son la prueba de que las reglas están protegidas.)_

Petición (la forma es impecable: JSON válido, estado `closed` existe en el vocabulario):

```txt
$ curl -i -X PATCH http://localhost:3000/requests/1 -H "Content-Type: application/json" -d '{"status":"closed"}'
```

```txt
HTTP/1.1 409 Conflict
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 108
Date: Tue, 06 Oct 2026 15:01:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"INVALID_STATUS_TRANSITION","message":"Cannot move a request from \"open\" to \"closed\""}}
```

Solicitud en estado terminal: cualquier modificación, aunque solo cambie la prioridad:

```txt
$ curl -i -X PATCH http://localhost:3000/requests/1 -H "Content-Type: application/json" -d '{"priority":"low"}'
```

```txt
HTTP/1.1 409 Conflict
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 116
Date: Tue, 06 Oct 2026 15:01:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"REQUEST_IN_TERMINAL_STATUS","message":"Request in terminal status \"closed\" cannot be modified"}}
```

Ambas líneas de estado fueron impresas por `curl -i` contra el servidor corriendo; la columna
"observado" no se copió de la esperada. El registro completo de las 15 peticiones quedó en el
log de la sesión de verificación.
