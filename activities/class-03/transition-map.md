# Transition map — ciclo de vida de una solicitud

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Lo que no aparece como transición permitida está prohibido: los huecos también son reglas.

## Estados

| Estado        | Significado en una frase                                             |
| ------------- | -------------------------------------------------------------------- |
| `open`        | Recién registrada; nadie la tomó.                                    |
| `in_progress` | Alguien la está atendiendo.                                          |
| `resolved`    | El equipo dice que quedó listo; falta la confirmación de quien reportó. |
| `closed`      | Confirmación final: el trabajo se dio por culminado.                 |
| `cancelled`   | El trabajo se interrumpió antes de culminarse.                       |

## Transiciones permitidas

| Desde         | Hacia         | ¿Qué la dispara?                                                        |
| ------------- | ------------- | ------------------------------------------------------------------------ |
| `open`        | `in_progress` | Alguien toma la solicitud y empieza a atenderla.                          |
| `open`        | `cancelled`   | Se decide que no corresponde atenderla (duplicado, ya resuelta, inválida). |
| `in_progress` | `resolved`    | El equipo termina el trabajo y lo declara listo.                          |
| `in_progress` | `cancelled`   | El trabajo se interrumpe a mitad (falta de repuestos, ya no aplica).      |
| `resolved`    | `in_progress` | Quien reportó no aceptó la resolución: hay que retomarla.                 |
| `resolved`    | `closed`      | Se confirma la resolución y el caso termina.                              |

## Transiciones inválidas notables

Las que alguien podría intentar y deben rechazarse, con su porqué:

| Intento                    | Por qué se rechaza                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `open → closed`            | Nadie cierra sin atender antes: saltaría `in_progress` y `resolved`.                                  |
| `open → resolved`          | Nadie resolvió nada todavía: no hay trabajo que declarar terminado.                                   |
| `in_progress → closed`     | Falta la confirmación de quien reportó; `resolved` es el paso donde se ofrece esa confirmación.       |
| `resolved → cancelled`     | Ya se resolvió: o se confirma (`closed`) o se reabre (`in_progress`); cancelar después borra historia.|
| `closed → in_progress`     | `closed` es terminal: reabrir rompería la confirmación final.                                         |
| `cancelled → open`         | `cancelled` es terminal: reactivar exige una decisión nueva fuera de este contrato.                   |
| `open → open` (sin cambio) | Un movimiento a sí mismo no es una transición; si el cliente lo envió, es un error que conviene avisar.|

## Estados terminales

`closed` y `cancelled`. Ninguna flecha sale de ellos.

Si se intenta modificar una solicitud terminal (cualquier `PATCH`, aunque solo cambie la
prioridad), la API responde `409` con el código `REQUEST_IN_TERMINAL_STATUS`. No `400`: la
petición está bien formada; lo que la vuelve imposible es el estado actual. No `200` silencioso
tampoco: avisar es parte del contrato.

## Justificación

* **¿Por qué `resolved` puede volver a `in_progress` pero `closed` no?** `resolved` es una
  afirmación del equipo ("creemos que está listo") que quien reportó puede refutar; `closed`
  es la confirmación final de ambas partes. Distinguirlos permite el ida y vuelta sin
  comprometer el cierre.
* **¿Por qué `cancelled` no vuelve a `open`?** Cancelar es interrumpir; cerrar es culminar.
  Ambos terminan, pero cuentan historias distintas. Si una cancelación se hace por error, el
  arreglo debería ser una decisión explícita (y documentada), no una transición silenciosa
  del mapa.
* **¿Por qué existe `open → cancelled`?** Porque también se puede decidir no atender antes de
  empezar: impedirlo obligaría a tomar la solicitud solo para poder cancelarla, que es teatro.
* El mapa completo es el ciclo de vida: no es decoración del campo `status`. Cada handler que
  recibe un `status` consulta este mapa en un solo lugar (`request-status.js`); si mañana
  cambia una transición, se toca un archivo, no todos los manejadores.
