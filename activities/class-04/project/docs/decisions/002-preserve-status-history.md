# Decisión 002 — Preservar el historial de estados

> Fecha: 2026-10-08 · Clase 04 · Autores: Adriana Mejía con asistencia de IA registrada en
> `ai-usage.md`. Estado: **aceptada e implementada**.

## Contexto

El contrato de `GET /requests` responde solo el `status` actual de cada solicitud. Si una
solicitud está `closed`, el sistema sabe *qué es*, pero no *cómo llegó*: de `open` a
`closed` directo, pasó por `in_progress` → `resolved`, o se canceló por error y se abrió
de nuevo. Con un solo campo mutable de estado, esa explicación se sobrescribe y se pierde
cada vez que la solicitud cambia.

## Opciones consideradas

1. **Solo el estado actual** (sin historial). El más barato: cero tablas, cero eventos.
   Inconveniente: la única foto es la última; cualquier problema de auditoría o de
   resolución de conflictos queda sin huella.
2. **Campos del estado que se sobreescriben** (`last_status_change`, `changed_by`). Sigue
   siendo una fotografía con metadatos: la *secuencia* completa se pierde igual.
3. **Tabla de eventos** (`request_status_history`). Cada transición legítima es una fila
   inmutable: `previous_status`, `new_status`, `changed_at`. La secuencia se puede
   reconstruir y ordenar (matriz, caso *Consultar historia*).

## Decisión

Se elige la opción 3: **preservar el historial**, con una fila por cambio de estado
(auditable, no inmutable por trigger sino por el flujo de la aplicación: solo la
aplicación escribe eventos, y los eventos nunca se actualizan ni se borran).

Reglas que la acompañan (implementadas en `database/migrations/002` y en `requests.store.js`):

* **El nacimiento es un evento**: `previous_status = NULL` significa "no existía"; se
  escribe en la misma transacción que crea la solicitud. Una solicitud nunca existe sin su
  primera fila de historia.
* **Cada transición = dos escrituras atómicas**: el `UPDATE` de `requests` y el `INSERT`
  del evento comparten `BEGIN`/`COMMIT`. Si el evento falla, todo se revierte (demostrado
  en `test-matrix.md`, *Rollback*).
* **El historial no se borra**: por eso `request_status_history` no tiene `ON DELETE
  CASCADE` y el sistema no expone `DELETE` (decisión 001).
* **Referencia íntegra**: `FOREIGN KEY (request_id) → requests(id)` impide historia
  huérfana, y los `CHECK` de `previous_status`/`new_status` mantienen el conjunto cerrado
  de los cinco estados.

## Consecuencias

* **A favor**: cada `status` actual viene con su explicación; el caso de una transición
  `open → closed` se puede auditar sin asumir; el `http-contract.md` promete la secuencia
  ordenada en `GET /requests/:id/history`.
* **En contra (reconocidas)**: una tabla que crece con cada transición (retensión sin
  política, anotada en `ai-usage.md` como abierta); la semántica de `NULL` exige
  documentación (el `CHECK` lo hace explícito); quien inserte con SQL directo sin pasar
  por la aplicación no tendrá historia — el contrato tolera `200 []`.