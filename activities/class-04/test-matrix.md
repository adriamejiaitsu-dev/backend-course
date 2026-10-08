# Test matrix — Entrega 04

> Fase 1: se declara lo **esperado**. Fase 6: cada caso se ejecuta y se registra lo
> **observado** (línea de estado literal y cuerpo). La columna observado se llena
> ejecutando, no copiando.

| Caso | Estado previo | Acción | Esperado | Observado |
| ---- | ------------- | ------ | -------- | --------- |
| Conectar correctamente | Proyecto activo | `npm run db:check` | Éxito: conexión, `requests` y `request_status_history` presentes | _(fase 6)_ |
| Crear solicitud | — | `POST /requests` con `{"title":"…"}` | `201` con `id`, `status:"open"`, fechas y evento de nacimiento | _(fase 6)_ |
| Reiniciar servidor | Solicitud creada | `GET /requests/:id` | Persiste: mismo `id`, mismos datos | _(fase 6)_ |
| Buscar inexistente | — | `GET /requests/999999` | `404` `{error:{code:"REQUEST_NOT_FOUND"}}` | _(fase 6)_ |
| Filtrar sin resultados | — | `GET /requests?status=closed` con ninguna cerrada | `200` `[]` | _(fase 6)_ |
| Cambiar prioridad | Solicitud `open` | `PATCH` con `{"priority":"high"}` | `200` con `updatedAt` nuevo y **sin** evento en la historia | _(fase 6)_ |
| Transición válida | Solicitud `open` | `PATCH` con `{"status":"in_progress"}` | `200` y evento `open → in_progress` en la historia | _(fase 6)_ |
| Transición inválida | Solicitud `open` | `PATCH` con `{"status":"closed"}` | `409` `INVALID_STATUS_TRANSITION` y **ninguna** escritura | _(fase 6)_ |
| Consultar historia | Transición hecha | `GET /requests/:id/history` | `200` con los eventos en orden cronológico | _(fase 6)_ |
| Falla del historial | Solicitud `open` | Cambio transaccional con fallo forzado en el `INSERT` de historia | Error (`500`) **y `requests` intacto**: `open` sigue siendo `open` | _(fase 6)_ |
| Base no disponible | Base pausada o sin red | Cualquier consulta | `503` `DATABASE_UNAVAILABLE`, la API sigue viva | _(fase 6)_ |
| Reinicio de Express | Datos existentes | Detener y volver a arrancar el servidor, luego `GET /requests` | Los datos siguen ahí (la prueba reina) | _(fase 6)_ |

## Casos propios (mínimo dos)

| Caso | Estado previo | Acción | Esperado | Observado |
| ---- | ------------- | ------ | -------- | --------- |
| `status` enviado al crear | — | `POST /requests` con `{"title":"…","status":"closed"}` | `201` con `status:"open"`: el servidor ignora el intento | _(fase 6)_ |
| Filtro combinado | Datos con estados y prioridades mezclados | `GET /requests?status=open&priority=high` | `200` solo con las filas que cumplen ambas | _(fase 6)_ |
| SQL injection literales en el título | — | `POST /requests` con `title = "x'; DROP TABLE requests; --"` | `201` y el título guardado tal cual; `requests` sigue existiendo | _(fase 6)_ |
| `:id` no numérico | — | `GET /requests/abc` | `404` `REQUEST_NOT_FOUND` (contrato v3 intacto, no un `500` de pg) | _(fase 6)_ |

## Evidencia clave (texto, sin secretos)

### Persistencia tras reinicio

_(El `201` con su id → el reinicio → el `200` posterior. Nunca la URL de conexión.)_

```txt
_(fase 6)_
```

### Rollback demostrado

_(Cómo provocaste el fallo controlado, la respuesta de error, y la consulta que muestra el
estado intacto. Documenta también cómo lo revertiste.)_

```txt
_(fase 6)_
```
