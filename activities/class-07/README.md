# Entrega 07 — Diagnóstico y errores observables

## Qué entregas

* El proyecto con los tres incidentes resueltos y el validador en PASSED.
* `incident-report.md` — tu reporte de incidentes, completado **mientras**
  investigas, no reconstruido de memoria al final.
* `validation-evidence.txt` — la salida real y completa de
  `npm run validate:class-07` con `FINAL RESULT: PASSED`.

## Qué NO entregas

* `.env` (contiene tu cadena de conexión y tu secreto reales).
* Tokens, passwords o logs que contengan un header `Authorization`.
* Capturas de tu panel de Supabase con credenciales visibles.

## Commits sugeridos

| Momento | Mensaje |
| --- | --- |
| Doctor en verde y suite inicial verde | `class-07-baseline` |
| INC-701 e INC-702 corregidos con sus pruebas | `class-07-incidents-resolved` |
| OPS-703 completo y validador en PASSED | `class-07-submission` |

Etiqueta final:

```bash
git tag class-07-submission
```

## Cómo se evalúa

| Dimensión | Peso |
| --- | --- |
| Reproducción y diagnóstico | 25% |
| Corrección de incidentes | 20% |
| Manejo consistente de errores | 20% |
| Request ID y logs seguros | 15% |
| Pruebas y validador | 15% |
| Explicación y uso de IA | 5% |

No se evalúa memoria de sintaxis ni sofisticación del prompt. Una
corrección que funciona pero que no puedes relacionar con la causa se
considera **incompleta**.

## Qué contiene esta carpeta

| Archivo | Contenido |
| --- | --- |
| `incident-report.md` | Reporte de INC-701, INC-702 y OPS-703, completado mientras se investigaba. |
| `validation-evidence.txt` | Salida real de `npm run validate:class-07` con `FINAL RESULT: PASSED`. |
| `ticket-salida.md` | Las 13 preguntas del cierre respondidas con ejemplos de la guardia. |
| `project/` | La copia del taller con los tres incidentes corregidos. |

Ejecutar:

```bash
cd project
cp .env.example .env      # DATABASE_URL y JWT_SECRET (no se suben al repo)
npm install
npm test
npm run validate:class-07
```

## AI usage

Registro completo en `incident-report.md`, sección **AI assistance**.

* **Qué ayudó a entender:** que el error *aparece* en la base pero *se origina* en la
  conversión de `req.params.id` en la ruta; que Express 5 reenvía errores solo con el
  middleware de cuatro parámetros registrado al final; y la diferencia entre la defensa de la
  aplicación y la de PostgreSQL.
* **Hipótesis propuestas:** para INC-701, "el parámetro se convierte en `NaN` y viaja a
  PostgreSQL"; para INC-702, "la aplicación no valida `priority` en el camino de escritura".
* **Cómo se verificó:** con el sistema, no con la confianza — `Number('not-a-number')` en el
  REPL, la restricción leída en `pg_constraint`, y reproducción con agentes y con `POST`.
* **Sugerencias descartadas:** validar en el store (demasiado tarde: el límite es HTTP) y
  usar `parseInt` (acepta `'12abc'` como `12`).

## Reflexión

* `ticket-salida.md` — las 13 preguntas respondidas con ejemplos propios: síntoma vs causa,
  por qué reproducir antes de tocar código, el doble significado de `404`, las dos defensas
  de INC-702, la allowlist de logs y `/health` vs `/ready`.
* La duda que queda abierta está al final de `incident-report.md`
  (**Remaining doubt**): cómo se propagaría el `requestId` si el backend creciera.
