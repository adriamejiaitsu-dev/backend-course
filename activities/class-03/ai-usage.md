# AI usage

> Regla de la entrega: la IA puede proponer código, pero no puede decidir silenciosamente el
> contrato o las reglas del sistema. Solo se usa **después** de la marca `class-03-design`.
> No hace falta copiar conversaciones completas: registra lo esencial con honestidad.

## My design before using AI

Nota honesta primero: esta entrega se produjo con asistencia de IA de principio a fin,
**incluido el diseño**. El tag `class-03-design` protege el orden diseño → código en el
historial, no un trabajo redactado sin IA; declaro esa desviación para que se lea con el
criterio correcto. Lo que sí quedó decidido y escrito **antes de la primera línea de
código** es esto:

* **Modelo** (`resource-model.md`): recurso `request` con 7 propiedades; `title` es lo único
  requerido; `id`, `status`, `createdAt` y `updatedAt` los decide el servidor; prioridad
  `medium` por defecto; cinco estados; siete invariantes escritas como promesas; cuatro
  dudas abiertas.
* **Contrato** (`http-contract.md`): los cuatro endpoints (`GET /requests`,
  `GET /requests/:id`, `POST /requests`, `PATCH /requests/:id`) con intención, query, body,
  respuesta exitosa, tabla de errores, código por situación y un ejemplo por endpoint. El
  formato de error `{ "error": { "code", "message" } }` y el orden 400 → 404 → 409.
* **Ciclo de vida** (`transition-map.md`): cinco estados, seis transiciones permitidas,
  `closed` y `cancelled` terminales, seis transiciones inválidas notables con su porqué y la
  justificación de por qué `resolved` vuelve a `in_progress` y `closed` no.
* **Verificación** (`test-matrix.md`): ocho casos base con su resultado esperado más siete
  casos propios, y el orden de ejecución pensado para que los estados previos cuadren.

## What I asked the AI

* Redactar los cuatro documentos de diseño a partir de las plantillas de la clase 03.
* Migrar `routes/` + `data/` a `modules/requests/` **sin cambiar el comportamiento**, para
  poder comprobar que los tres endpoints originales seguían igual.
* Decidir dónde vive la regla "open no puede pasar a closed" y quién responde cada código.
* Implementar la creación con identidad del servidor, `PATCH`, filtros y el formato de
  error unificado, en el orden sugerido por el docente.
* Ejecutar la matriz de pruebas con `curl` y transcribir lo observado, no lo esperado.
* Redactar la nota de decisión 001 y la reflexión final.

## What the AI proposed

* Estructura de tres archivos con responsabilidades separadas: `requests.routes.js`
  (recibe HTTP, responde HTTP), `requests.store.js` (array, contador de ids, identidad) y
  `request-status.js` (estados y transiciones, sin conocer ni el array ni Express).
* Orden de implementación: migrar → máquina de estados → creación → `PATCH` → filtros →
  formato de error, con un commit por paso y el proyecto corriendo en cada uno.
* Que la regla de transición viva en una sola función `checkUpdate(current, next)` que
  devuelve un resultado de dominio (`code` + `message`) y que las rutas solo lo traduzcan a
  HTTP.
* Un middleware de errores en `app.js` para que un JSON mal formado no devuelva una página
  HTML.
* Incluir los ocho casos base de la clase más casos propios: filtro desconocido, body
  vacío, `status` al crear, `priority` inválida, transición a terminal y `status`
  desconocido en `PATCH`.

## What I accepted

* Los tres archivos del módulo y su separación de responsabilidades: el beneficio es que
  cambiar una transición toca un solo archivo; el costo es un archivo más y una llamada
  extra entre capas.
* El orden de implementación por pasos con commits verificables: beneficio, cada commit
  deja el proyecto corriendo y se puede auditar qué cambió primero; costo, más idas y
  vueltas que reescribir todo de una vez.
* `checkUpdate` en el módulo de estado y no en las rutas: beneficio, la regla queda
  protegida en un solo lugar (era exactamente el dolor del bloque 10); costo, el store
  depende de `request-status.js`.
* El middleware de JSON mal formado: beneficio, se cumple la promesa "todo error usa la
  misma forma"; costo, un comportamiento que el contrato no había previsto en detalle.

## What I rejected or changed

* **`DELETE /requests/:id`** — rechazado. No está en el contrato, el alcance lo excluye y
  borrá contradice el registro que sostiene el resto del sistema. La razón completa, con
  costos de ambas opciones, está en `project/docs/decisions/001-cancel-instead-of-delete.md`.
* **Capas controllers / services / repositories** — rechazadas. Serían carpetas sin
  contenido real que hoy nadie podría justificar; la cohesión por tema alcanza.
* **Librería de validación (`zod`, `express-validator`, `joi`)** — rechazada. La validación
  sistemática tiene su clase; aquí solo se protege el contrato mínimo.
* **Persistencia en archivo o base de datos** — rechazada. Los datos en memoria y la
  pérdida al reiniciar son comportamiento esperado y documentado.
* **Código `INVALID_JSON` propio** — propuesto y **no aceptado**. El contrato ya contempla
  el body no parseable en la fila `EMPTY_PATCH_BODY`, así que se usó ese código tal como
  está escrito. Beneficio de no aceptarlo: el contrato de la fase 1 no se toca después del
  tag. Costo: en un `POST`, un código que dice "PATCH" suena raro; si se retoma el proyecto,
  conviene renombrarlo **y** actualizar el contrato en el mismo commit.
* **Código `INTERNAL_ERROR` para fallos inesperados** — también descartado por lo mismo:
  habría obligado a editar la tabla de códigos del contrato fuera del proceso acordado. Los
  errores inesperados quedan en el manejador por defecto de Express.

## How I verified the result

* 15 peticiones `curl` ejecutadas el 06/10/2026 contra `node src/server.js` en el puerto
  3000 (los 8 casos base, los 6 casos propios y el paso intermedio `in_progress → resolved`
  necesario para encadenarlos); la columna "observado" de `test-matrix.md` se transcribió
  del log de esa sesión, no de la columna esperada: todo lo previsto coincidió.
* Evidencia textual de las dos reglas protegidas: `409 INVALID_STATUS_TRANSITION` en
  `open → closed` y `409 REQUEST_IN_TERMINAL_STATUS` sobre una solicitud `closed`,
  ambas con la línea de estado literal de `curl -i` en la sección "Evidencia".
* Recorrido completo de la máquina de estados en vivo: `open → in_progress → resolved →
  closed` con `200` en cada paso, y luego `409` al intentar modificar la cerrada.
* Reinicio del servidor entre grupos de casos: la colección volvió a su estado inicial y el
  contador de ids volvió a empezar en 4, tal como declara el README.

## What I still do not understand

* Por qué el código `EMPTY_PATCH_BODY` es el que responde a un JSON mal formado en `POST`:
  funciona y el contrato lo dice, pero el nombre apunta a otra situación.
* Qué pasaría con dos `PATCH` simultáneos sobre la misma solicitud. Hoy no hay concurrencia
  real (un solo proceso, memoria), pero `updatedAt` no sirve como control y no sé hasta qué
  punto habría que intentarlo antes de tener persistencia.
* Si ignorar los campos desconocidos en vez de rechazarlos es la mejor decisión a largo
  plazo: esconde errores de tipeo del cliente (`titel` quedaría vacío y el `400` diría otra
  cosa). Está elegido y documentado, pero no lo defendería con la misma seguridad que las
  transiciones.
* El límite exacto entre "la ruta traduce el resultado" y "la ruta empieza a decidir": hoy
  las rutas validan forma y traducen dominio, pero esa frontera se me hace movible.
