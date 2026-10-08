# Cancel requests instead of deleting them

> Nota de decisión 001 · `project/docs/decisions/001-cancel-instead-of-delete.md`
> Una buena nota explica por qué una opción tuvo sentido en un contexto concreto — con los
> costos reconocidos, no solo los beneficios.

## Context

What problem or requirement produced this decision?

La entrega 03 pide un ciclo de vida completo para las solicitudes de mantenimiento: cinco
estados, transiciones controladas y reglas protegidas. En ese diseño aparece una pregunta
concreta: ¿qué hacemos cuando alguien ya no quiere que su solicitud siga su camino? La
tentación es agregar `DELETE /requests/:id` y listo, pero borrar un registro contradice lo
que el resto del sistema está construyendo: `closed` y `cancelled` existen justamente para
que una solicitud tenga un final **registrable**. Si además se borra, el id desaparece y el
contador de identidad ya no garantiza nada para los clientes que guardaron ese número.

## Options

### Option 1: Physically delete the request

Benefits:

* El array no crece: las solicitudes atendidas desaparecen de la colección y la lista
  siempre muestra solo trabajo pendiente.
* Un `DELETE` es la operación REST que todo cliente espera; no tenerlo puede parecer un
  hueco del contrato.
* Menos estados que sostener: sin `cancelled`, el mapa tendría una flecha menos.

Costs:

* Se pierde la historia: quién reportó, qué prioridad tenía, cuándo se creó y cuándo dejó
  de existir. Para mantenimiento, el registro es el producto.
* La identidad se rompe: `GET /requests/2` pasaría a devolver `404` para algo que el
  cliente vio con `201`. Los ids dejarían de ser una promesa.
* Aparecen preguntas que hoy no tenemos cómo responder: ¿borrado lógico o físico?, ¿quién
  tiene permiso?, ¿y si algo todavía lo referencia?. Cada una es alcance nuevo.
* El contador `nextId` dejaría de ser la única fuente de verdad: si algún día algo se
  borra del array, vuelve el bug de `array.length + 1`.

### Option 2: Preserve it with status cancelled

Benefits:

* La historia queda: la solicitud sigue existiendo con su id, sus fechas y su final.
* El contrato no se agranda: `PATCH` y la máquina de estados ya cubren el caso; no hay
  método, permiso ni ruta nueva.
* La identidad se sostiene: el array nunca achica, así que el contador sigue siendo
  correcto mientras el proceso viva.
* Responde la pregunta del negocio con un significado claro: cancelar es interrumpir,
  cerrar es culminar. Son dos finales distintos y ambos quedan registrados.

Costs:

* La colección crece sin límite y `GET /requests` devuelve trabajo terminado junto con el
  pendiente; sin paginación ni filtro de exclusión, la respuesta se ensucia con los años.
* No se puede deshacer un registro erróneo: una solicitud creada por accidente queda para
  siempre (hoy se puede llevar a `cancelled`, pero nunca a borrarse).
* El cliente que espera `DELETE` recibe un `405` implícito: el contrato es más corto que
  lo que algunos consumidores consideran estándar.
* Si mañana hace falta purgar datos (RGPD, disco), habrá que diseñar ese borrado igual.

## Decision

We chose option 2: cancel, never delete.

Porque el sistema de esta entrega está construido sobre la memoria de lo que pasó con cada
solicitud. El estado `cancelled` ya expresa la intención de interrumpir, la máquina de
estados ya protege que nada se mueva después, y la identidad se mantiene intacta. Borrar
habría sido la única operación del sistema que destruye información en lugar de
transformarla, y no había ningún requerimiento que la pidiera.

## Consequences

What do we gain?

Un ciclo de vida completo donde toda solicitud tiene un final registrado (`closed` o
`cancelled`) y ninguna desaparece sin dejar rastro; el contrato sigue teniendo cuatro
endpoints.

What complexity appears?

La colección acumula terminadas; hoy se responde `200` con todo y se documenta como
limitación, pero el filtro por `status` es lo único que permite mirar solo el trabajo
pendiente.

What can no longer be done?

No se puede recuperar espacio ni ocultar un registro eliminado: `DELETE /requests/:id` no
existe y agregarlo rompería la promesa de que un id visto una vez siempre responde.

What may need to change later?

Cuando haya paginación, un filtro de exclusión de terminadas o un guardado real, conviene
revisar esta nota: quizá aparezca un borrado físico con permisos, auditoría y una razón
nueva para pedirlo. La decisión queda registrada para que ese día se reevalúe con
contexto, no por costumbre.
