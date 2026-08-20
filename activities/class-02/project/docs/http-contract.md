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
| Respuesta de éxito    | `200` con un arreglo JSON de solicitudes (puede estar vacío) |
| Respuestas de error   | Ninguna propia; una ruta inexistente responde `404` |

**Ejemplo de respuesta**

```json
[
  { "id": 1, "title": "Projector does not turn on", "description": "The projector in room 204 shows no image during class.", "status": "open", "priority": "high" }
]
```

---

## Endpoint 2 — Consultar una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `GET` |
| Ruta                  | `/requests/:id` |
| Entrada               | Path parameter `id` (llega como texto, se convierte a número) |
| Respuesta de éxito    | `200` con el objeto de la solicitud |
| Respuestas de error   | `404` con `{ "error": "Request not found" }` si no existe |

**Ejemplo de respuesta (éxito)**

```json
{ "id": 1, "title": "Projector does not turn on", "description": "The projector in room 204 shows no image during class.", "status": "open", "priority": "high" }
```

**Ejemplo de respuesta (error)**

```json
{ "error": "Request not found" }
```

---

## Endpoint 3 — Crear una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `POST` |
| Ruta                  | `/requests` |
| Entrada               | Body JSON con `title` (obligatorio), `description` y `priority` (opcionales) |
| Respuesta de éxito    | `201` con el objeto creado (incluye `id` y `status: "open"`) |
| Respuestas de error   | `400` con `{ "error": "Title is required" }` si falta el título o es solo espacios, y **ningún** dato nuevo guardado |

**Ejemplo de body de la petición**

```json
{ "title": "Air conditioning is noisy", "description": "Room 110 makes noise all morning.", "priority": "low" }
```

**Ejemplo de respuesta (éxito)**

```json
{ "id": 4, "title": "Air conditioning is noisy", "description": "Room 110 makes noise all morning.", "status": "open", "priority": "low" }
```

**Ejemplo de respuesta (error de validación)**

```json
{ "error": "Title is required" }
```

---

## Reglas transversales

1. Todas las respuestas devuelven `Content-Type: application/json` (lo hace `res.json()`).
2. Una ruta que no existe en esta API responde `404`.
3. Un cuerpo de error siempre tiene la forma `{ "error": "<mensaje>" }`.
4. El servidor ignora `id` y `status` si el cliente los envía en el body: los asigna él.

## Decisiones que tomaste y por qué

- **El filtro por estado es una query y no una ruta**: `/requests` sigue siendo el mismo
  recurso; la query modifica cómo se presenta la colección, no cuál es.
- **`404` y no `400` cuando el id no existe**: el `404` dice «lo que pediste no está aquí»;
  la petición del cliente está bien formada, el recurso es el ausente.
- **`400` y no `404` cuando falta el título**: la petición del cliente está incompleta, no
  ausente; el motivo del rechazo es distinto al del recurso inexistente.
- **El título se valida con `trim()`**: un título de solo espacios no es un título.
- **Los datos viven en memoria**: se pierden al reiniciar. Es comportamiento esperado de este
  incremento, no un defecto.
- **No hay `PUT`, `PATCH` ni `DELETE`**: actualizar y eliminar están fuera del alcance.