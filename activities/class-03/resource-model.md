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

## Campos opcionales

* `description` — puede faltar; si falta, no se inventa (queda `undefined` y no se serializa).
* `priority` — puede faltar; si falta, el servidor aplica `medium`. Valores admitidos:
  `low`, `medium`, `high`.

## Campos generados por el servidor

El servidor **no acepta** del cliente: `id`, `status`, `createdAt`, `updatedAt`.

* `id`: contador en memoria que solo avanza. Si lo generara el cliente, dos clientes podrían
  chocar y `array.length + 1` repetiría identificadores en cuanto algo falte del array.
* `status`: una solicitud nueva nace `open`. Que el cliente envíe `"status": "closed"` al
  crear no es una preferencia: es una regla del dominio. El campo se **ignora**.
* `createdAt` / `updatedAt`: el reloj del servidor, no el de cada cliente.
* Campos no reconocidos (`owner`, `notes`, `priorityRank`…) también se ignoran en lugar de
  rechazarse: decisión de diseño registrada en el contrato, no un olvido.

## Estados permitidos

Lista cerrada de valores de `status`:

| Estado        | Significado                                                        |
| ------------- | ------------------------------------------------------------------ |
| `open`        | Recién creada, nadie la tomó todavía.                              |
| `in_progress` | Alguien la está atendiendo.                                        |
| `resolved`    | El equipo dice que quedó listo; falta que quien reportó lo confirme. |
| `closed`      | Confirmación final. Ya no vuelve a moverse.                        |
| `cancelled`   | Se interrumpió el trabajo. Ya no vuelve a moverse.                 |

## Reglas

Las condiciones que el sistema debe preservar siempre, escritas como promesas:

* Nunca existirá una solicitud cuyo `status` no pertenezca al conjunto cerrado
  `{ open, in_progress, resolved, closed, cancelled }`.
* Nunca una solicitud nacerá en otro estado que no sea `open`, ni llevará un `id` o unas
  fechas decididas por el cliente.
* Nunca una solicitud cambiará de estado por un movimiento que no esté declarado en el mapa
  de transiciones (`transition-map.md`); lo que no aparece como flecha está prohibido.
* Nunca una solicitud en estado terminal (`closed`, `cancelled`) cambiará de nuevo: ni de
  estado ni de ningún otro campo.
* Nunca existirán dos solicitudes con el mismo `id` mientras el proceso viva.
* Nunca el servidor guardará una `priority` fuera de `{ low, medium, high }`; si no llega,
  será `medium`.
* Nunca una solicitud tendrá `updatedAt` anterior a su `createdAt`.

## Dudas

Lo que el requerimiento no dice y habría que preguntar. Anotarlas es diseño, no derrota:

* ¿Se puede reabrir una solicitud `cancelled`? Hoy no: es terminal. Si el negocio necesita
  "cancelar por error y reactivar", el mapa cambia y con él el contrato.
* ¿`resolved → closed` debería exigir una confirmación de quien reportó (un campo, una
  ruta) o basta con que el equipo la marque? Hoy basta con el `PATCH`.
* ¿La prioridad puede recalcularse sola (una solicitud `high` vieja sube de nivel)? No hay
  reglas de antigüedad en este incremento.
* ¿Debe existir un responsable/assignee? El requerimiento no lo menciona y agregarlo hoy
  rompería el contrato mínimo acordado.
* ¿Y si dos personas envían un `PATCH` al mismo tiempo? Con memoria en proceso no hay
  concurrencia real, pero el `updatedAt` ayudaría a detectar quién llegó después.
