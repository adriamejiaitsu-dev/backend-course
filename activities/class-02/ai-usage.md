# AI usage

> Los títulos de sección están en inglés a propósito: son los mismos en todas las entregas de
> la materia. El contenido se escribe en español.

## What I asked for

El trabajo se hizo con la asistencia de un asistente de IA de código (opencode). Le pedí, en
orden:

1. **Contexto**: analizar la presentación de la clase 2 (los 11 bloques) y sus recursos, para
   entender qué se esperaba de la Entrega 02.
2. **Análisis Lite**: ayudarme a ejecutar la API Lite y registrar la evidencia observada.
   Esto se documenta aquí con honestidad: el `lite-analysis.md` de esta entrega fue
   elaborado con asistencia de IA, lo que **se aparta de la restricción «sin IA en la primera
   fase»** declarada en la consigna. Tomo nota del riesgo: el tag `class-02-lite-analysis` fue
   concebido para certificar un análisis hecho sin IA, y este no lo es.
3. **Contrato del Full**: redactar `project/docs/http-contract.md` antes de implementar.
   Restricciones dadas: solo Express, sin base de datos, sin TypeScript, sin autenticación,
   sin controladores/servicios/repositorios, sin `PUT`/`PATCH`/`DELETE`.
4. **Implementación**: completar `src/routes/requests.routes.js` respetando el contrato.
5. **Verificación**: preparar y ejecutar los casos de prueba y registrar los resultados reales.

## What the AI proposed

- Para el análisis Lite, propuso la tabla con una fila por comportamiento y redactó el
  documento con base en la evidencia real capturada del servidor.
- Para el Full, propuso implementar `GET /`, `GET /:id` y `POST /` en el router con
  `req.query.status` para el filtro, `req.params.id` convertido con `Number(...)`, y una
  validación de `title` con `trim()`.
- Sugirió además completar los documentos de la entrega (`casos-de-prueba.md`,
  `comparison.md`, `README.md`) y crear `.gitignore`.

## What I accepted

- La implementación de los tres endpoints tal como fue propuesta: coincide con
  `docs/http-contract.md`, respeta la división de responsabilidades y no introduce
  exclusiones. La verifiqué ejecutando cada caso (ver `How I verified it`).
- El enfoque de validar el título con `trim()`: un título de solo espacios no es un título.
- La estructura propuesta para `casos-de-prueba.md`, con el resultado observado pegado a cada
  petición, porque es lo que la entrega exige registar.

## What I changed or rejected

- **El patrón `200` + `{"error":...}` que tenía la API Lite original**: lo rechacé en la
  corrección, aplicando `404` para el recurso inexistente (coherencia entre estado y cuerpo).
- **La ruta `GET /getRequests`**: la eliminé y expuse `GET /requests`, para que la ruta
  nombre el recurso y no la acción.
- La IA **no añadió** dependencias ni capas fuera del alcance (no propuso base de datos,
  autenticación ni `PUT`/`DELETE`); no hubo nada que descartar por exceder las exclusiones.
- Se evitó dejar `node_modules/` fuera de la entrega (`.gitignore`).

## How I verified it

Para la **Lite original** (antes de corregir), ejecuté con `curl -i`:

```bash
curl -i http://localhost:3000/getRequests   # 200 + 3 solicitudes
curl -i http://localhost:3000/requests      # 404 Cannot GET /requests
curl -i http://localhost:3000/requests/999  # 200 + {"error":"Request not found"}
curl -i -X POST http://localhost:3000/requests ... # 200, id 4
curl -i -X POST http://localhost:3000/requests ... # 200, id 5 sin title
curl -i http://localhost:3000/getRequests   # la lista ya contiene id 5 incompleto
```

Para la **Lite corregida**, los mismos casos: `GET /requests` → `200`; `GET /requests/999` →
`404`; `POST` con título → `201`; `POST` sin título → `400`; `GET /getRequests` → `404`.

Para el **Full**, `GET /requests` → `200`; `GET /requests/2` → `200`; `GET /requests/999` →
`404`; `GET /requests?status=open` → `200` con 2 elementos; `POST` válido → `201`;
`POST` con body `{}` → `400`; `POST` con `"title":"   "` → `400`; listado final sin datos de
los rejectados. Ninguna respuesta quedó en `501`.

Los outputs completos están en `lite-evidence-partA.txt`, `lite-evidence-partB.txt` y
`full-evidence-partC.txt`, y se resumen en `casos-de-prueba.md`.

## What I still do not understand

- La diferencia práctica entre `200` con cuerpo vacío y `204 No Content` en un caso real:
  entiendo que el primero no `declara` la ausencia de cuerpo en el estado, pero aún me falta
  verlo en un cliente real.
- Hasta dónde conviene validar el body en un `POST` sin caer en una capa de validación: hoy
  solo valido el `title`; no tengo claro cuándo valida otros campos un contrato bien diseñado.
- El impacto real de la multiplexación de HTTP/2 en una app pequeña como esta: sé que cambia
  el transporte y no la semántica, pero no lo he medido.