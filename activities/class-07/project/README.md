# Clase 07 — Cuando el backend falla

Es tu **segunda semana** como desarrollador backend junior. Completaste tu
primer ticket y ahora formas parte del equipo que mantiene la API de
solicitudes. Soporte reporta que algunos usuarios reciben errores al
consultar y modificar solicitudes; las respuestas no son claras y los logs
actuales no permiten relacionar una petición con el error producido.

Tu tarea: **investigar los incidentes, corregir los defectos y mejorar la
capacidad del backend para explicar qué está ocurriendo.** Puedes usar IA
durante todo el proceso. No puedes cambiar el contrato solo para silenciar
una prueba.

> Antes de corregir un problema debemos poder reproducirlo, observarlo,
> formular una hipótesis y comprobar la solución.

## Los tres incidentes

| Incidente | Reporte | Brief |
| --- | --- | --- |
| INC-701 | Algunos identificadores devuelven error interno | `incidents/INC-701-invalid-request-id.md` |
| INC-702 | Actualizar ciertas prioridades produce error interno | `incidents/INC-702-invalid-priority.md` |
| OPS-703 | Los errores no se pueden rastrear en los logs | `incidents/OPS-703-untraceable-errors.md` |

## Tablero del taller

* [ ] **Baseline** — el sistema funciona antes de tocarlo
* [ ] **Reproducción** — los tres incidentes reproducidos con evidencia
* [ ] **Diagnóstico** — síntoma ≠ causa: hipótesis y comprobación
* [ ] **INC-701** — id inválido responde 400, con prueba de regresión
* [ ] **INC-702** — prioridad inválida responde 400, restricción intacta
* [ ] **Error handler** — un solo lugar traduce errores a respuestas
* [ ] **Request ID** — respuesta y log comparten identificador
* [ ] **Logs** — una línea JSON por petición, sin datos sensibles
* [ ] **Health/ready** — el proceso vive; la disponibilidad se comprueba
* [ ] **Validación** — `npm run validate:class-07` en PASSED

## Puesta en marcha (baseline)

Usa el **mismo proyecto de Supabase de la clase 06** — misma base, misma
cadena de conexión, mismo secreto. No crees nada nuevo.

```bash
git status                  # registra desde dónde partes
cp .env.example .env        # pega tu DATABASE_URL y JWT_SECRET de la clase 06
npm install
npm run class-07:doctor     # 7 comprobaciones -> Environment ready for incident response.
npm run db:migrate          # todas las migraciones deben decir SKIPPED
npm run db:seed             # reconstruye SOLO los datos del taller
npm test                    # verde: 20 pruebas pass, 17 todo (las escribirás tú)
```

Si el baseline no funciona, **detente**: todavía no sabes si un fallo
posterior pertenece al ticket o al ambiente. Consulta `recovery/`.

## Comandos del taller

| Comando | Qué hace |
| --- | --- |
| `npm run class-07:doctor` | Diagnóstico del entorno (7 checks, no destructivo) |
| `npm run incidents:reproduce` | Reproduce los 3 incidentes: expected vs actual |
| `npm run db:migrate` / `db:seed` | Esquema y datos del taller (repetibles) |
| `npm test` | Suite completa (`node:test` + Supertest) |
| `npm run dev` | Servidor con recarga; aquí verás los logs |
| `npm run validate:class-07` | Validador final (12 checks) |

## Credenciales del seed (datos de demostración)

| Usuario | Email | Password | Rol |
| --- | --- | --- | --- |
| Ana | `ana.requester.seed@example.test` | `ana clave del taller 06` | requester |
| Luis | `luis.requester.seed@example.test` | `luis clave del taller 06` | requester |
| María | `maria.agent.seed@example.test` | `maria clave del taller 06` | agent |

Son datos de taller, públicos a propósito. Tu `DATABASE_URL` y tu
`JWT_SECRET` sí son secretos reales: nunca los pegues en un chat, un
commit o una captura.

## Reglas para trabajar con IA

La IA **puede**: explicar errores, separar síntoma de hipótesis, seguir un
valor por el código, proponer hipótesis con su comprobación, sugerir
cambios pequeños que TÚ ejecutas y verificas.

La IA **no decide en silencio**: el contrato HTTP, qué error es público,
qué se registra en los logs, qué código se elimina, qué prueba se ignora,
si una restricción de base desaparece, ni si una expectativa se cambia
"para que dé verde".

> Una hipótesis no se convierte en causa porque una IA la escribió.
> Necesitamos una comprobación.

## Entrega

Completa `activities/class-07/incident-report.md` mientras trabajas (no al
final de memoria) y guarda la salida real del validador en
`activities/class-07/validation-evidence.txt`. Detalles y commits sugeridos
en `activities/class-07/README.md`. **Nunca incluyas `.env`.**
