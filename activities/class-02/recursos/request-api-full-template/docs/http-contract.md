# Contrato HTTP — Request API Full

> **Plantilla para completar.** Escribe este documento **antes** de implementar los
> manejadores. El contrato es la promesa que hace tu API; el código es la manera de cumplirla.
> Si primero escribes el código y después el contrato, estarás documentando lo que salió, no
> lo que decidiste.

## Recurso

Describe en dos o tres líneas qué representa una **solicitud** (`request`) en este sistema.

_(Completar)_

### Forma del recurso

| Campo         | Tipo   | Obligatorio | Quién lo asigna | Notas |
| ------------- | ------ | ----------- | --------------- | ----- |
| `id`          |        |             |                 |       |
| `title`       |        |             |                 |       |
| `description` |        |             |                 |       |
| `status`      |        |             |                 |       |
| `priority`    |        |             |                 |       |

---

## Endpoint 1 — Listar solicitudes

| Elemento              | Valor |
| --------------------- | ----- |
| Método                |       |
| Ruta                  |       |
| Entrada               |       |
| Respuesta de éxito    |       |
| Respuestas de error   |       |

**Ejemplo de respuesta**

```json

```

---

## Endpoint 2 — Consultar una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                |       |
| Ruta                  |       |
| Entrada               |       |
| Respuesta de éxito    |       |
| Respuestas de error   |       |

**Ejemplo de respuesta (éxito)**

```json

```

**Ejemplo de respuesta (error)**

```json

```

---

## Endpoint 3 — Crear una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                |       |
| Ruta                  |       |
| Entrada               |       |
| Respuesta de éxito    |       |
| Respuestas de error   |       |

**Ejemplo de body de la petición**

```json

```

**Ejemplo de respuesta (éxito)**

```json

```

**Ejemplo de respuesta (error de validación)**

```json

```

---

## Reglas transversales

Responde en una línea cada una:

1. ¿Qué `Content-Type` devuelven todas las respuestas?
2. ¿Qué estado corresponde a una ruta que no existe en esta API?
3. ¿Qué forma tiene siempre un cuerpo de error?
4. ¿Qué campos ignora el servidor si el cliente los envía en el body?

## Decisiones que tomaste y por qué

Anota aquí cualquier decisión que no sea obvia leyendo las tablas (por ejemplo: por qué
elegiste un estado y no otro, o qué hiciste con los campos opcionales ausentes).

_(Completar)_
