# Análisis del proyecto Lite

> Análisis independiente de `lite-api/`, realizado con el servidor ejecutándose y cada
> petición comprobada con `curl -i`. Este documento es la línea base para decidir qué se
> corrige y por qué. Guardar con el tag `class-02-lite-analysis`.

## 1. Cómo ejecuté la API

```bash
cd lite-api
npm install
node server.js
# Request API Lite is running on http://localhost:3000
```

Luego, en otra terminal, ejecuté cada caso con `curl -i` para ver la línea de estado completa
(protocolo + código + motivo), no solo el cuerpo.

## 2. Tabla de análisis

Una fila por comportamiento observado. Donde un endpoint cambia según la entrada, hay una
fila por caso.

| Endpoint | Intención | Entrada | Respuesta actual | Problema | Propuesta |
| -------- | --------- | ------- | ---------------- | -------- | --------- |
| `GET /getRequests` | Listar todas las solicitudes | — | `200` + arreglo JSON con 3 solicitudes | La ruta usa un verbo (`get`) en lugar de nombrar el recurso; una ruta existe en el código pero un cliente no la adivinaría como parte de un recurso | `GET /requests` → `200` con el arreglo JSON |
| `GET /requests` | Listar todas las solicitudes (recurso) | — | `404` + `Cannot GET /requests` | Aunque el recurso existe, no hay ruta que lo exponga bajo su nombre | La misma propuesta anterior: exponer `GET /requests` |
| `GET /requests/1` | Consultar la solicitud 1 | path parameter `id=1` | `200` + objeto de la solicitud 1 | Correcto | Se mantiene igual |
| `GET /requests/999` | Consultar la solicitud 999 (inexistente) | path parameter `id=999` | `200` + `{"error":"Request not found"}` | Estado y cuerpo se contradicen: `200` afirma éxito pero el cuerpo describe un fallo; un cliente automático no puede distinguir el error leyendo solo el estado | `GET /requests/999` → `404` + `{"error":"Request not found"}` |
| `POST /requests` (con `title`, `description`, `priority`) | Crear una solicitud nueva | body JSON con `title` | `200` + objeto creado con `id: 4` y `status: "open"` | La creación devuelve exactamente el mismo estado que una consulta; el cliente no puede saber si se creó algo nuevo (`201`) o solo se le devolvió algo existente (`200`) | `POST /requests` → `201` + objeto creado |
| `POST /requests` (sin `title`) | Crear una solicitud nueva | body JSON sin `title` | `200` + objeto creado sin campo `title` (`id: 5`) | Se acepta una creación incompleta: el `title` figura como obligatorio en el contrato y no se valida; al listar queda una solicitud sin título | `POST /requests` sin `title` → `400` + `{"error":"Title is required"}` y **ningún** dato nuevo guardado |

## 3. Evidencia

Peticiones y respuestas reales, con la línea de estado incluida.

```txt
===== A1 · GET /getRequests =====
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[{"id":1,...},{"id":2,...},{"id":3,...}]

===== A1b · GET /requests =====
HTTP/1.1 404 Not Found
Content-Type: text/html; charset=utf-8

Cannot GET /requests

===== A2 · GET /requests/1 =====
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":1,"title":"Projector does not turn on","description":"The projector in room 204
 shows no image during class.","status":"open","priority":"high"}

===== A3 · GET /requests/999 =====
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"error":"Request not found"}

===== A4 · POST /requests (válida) =====
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Leaking faucet","description":"The faucet in the third floor bathroom
 leaks.","status":"open","priority":"medium"}

===== A5 · POST /requests (sin título) =====
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":5,"description":"No title at all","status":"open","priority":"low"}

===== A6 · GET /getRequests después de A4 y A5 =====
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[{... id:1 ...},{... id:2 ...},{... id:3 ...},
 {"id":4,"title":"Leaking faucet",...},
 {"id":5,"description":"No title at all",...}]
```

## 4. Preguntas guía

1. **¿Qué recurso representa esta API y cómo se nombra en cada una de sus rutas?**
   Representa **solicitudes de mantenimiento** (`requests`). En el código el recurso se
   nombra de dos maneras distintas: `GET /getRequests` (con verbo) y `GET /requests/:id` y
   `POST /requests` (con nombre de recurso). `GET /requests` —la ruta que unificaría el
   patrón— no existe en el servidor y responde `404`.

2. **¿Qué método HTTP corresponde a cada intención, y coincide con el que usa el código?**
   Listar → `GET`; consultar uno → `GET`; crear → `POST`. Los métodos coinciden con la
   intención. El problema está en los códigos de estado de las respuestas, no en los métodos.

3. **¿Qué código de estado devuelve cada respuesta y qué afirma exactamente ese código?**
   - Listar (`/getRequests`) → `200 OK`: afirma que la petición se procesó y que el cuerpo es
     válido. Aquí el `200` es honesto.
   - Consultar un `id` inexistente → `200 OK` con `{"error":...}`: el `200` **afirma éxito**
     cuando lo que ocurrió es un fallo del cliente (recurso inexistente).
   - Crear válida → `200 OK`: el `200` dice «salió bien», pero no comunica que se **creó** un
     recurso nuevo.
   - Crear sin título → `200 OK`: niega que haya un problema en la petición.

4. **¿Hay alguna respuesta cuyo estado contradiga su propio cuerpo? ¿Cuál y por qué?**
   Sí. `GET /requests/999` responde `200` con `{"error":"Request not found"}`. La primera
   línea del mensaje (el estado) le dice al cliente «todo salió bien», mientras que el cuerpo
   le dice «el recurso no existe». Un programa que decide por el estado trataría el error como
   un éxito.

5. **¿Qué entradas acepta el servidor sin comprobarlas, y qué consecuencia tiene aceptarlas?**
   Acepta un body sin `title` en `POST /requests`: `req.body.title` llega `undefined` y de
   todos modos se crea y se guarda la solicitud. Consecuencia observable: al listar aparece
   una solicitud incompleta (la de `id: 5`), con un campo obligatorio ausente.

6. **¿Cómo distinguiría un cliente automático un éxito de un error sin leer el cuerpo?**
   Con el contrato actual, **no puede**. Tanto el `200` de una consulta correcta, el `200` de
   un recurso inexistente y el `200` de una creación son indistinguibles si solo se mira el
   estado. Necesitaría leer el cuerpo (y adivinar el formato), quedando a merced de campos que
   pueden cambiar.

7. **¿Qué parte del comportamiento observado no podía deducirse leyendo solo las rutas?**
   Que `GET /requests/999` devuelva `200` en lugar de `404`, que la creación devuelva `200` en
   lugar de `201`, y que `POST` acepte un body sin título. Las rutas anuncian *qué* se ofrece;
   el estado real, los *códigos* que devuelve cada caso, solo se sabe ejecutando.

8. **Si otra persona consumiera esta API sin ver el código, ¿qué supuesto la haría fallar?**
   El supuesto de que un `200` siempre significa éxito. Si alguien programa un cliente que
   decide por el estado, guardaría como válida una solicitud que no existe y asumiría como
   creada una solicitud que se guardó incompleta.

## 5. Conclusión

El problema más grave para quien consume la API es la contradicción estado/cuerpo en
`GET /requests/:id`: el servidor responde `200` con un cuerpo de error cuando el recurso no
existe. Es el más grave porque ocurre en una operación de lectura (la más frecuente), porque
rompe el supuesto básico del protocolo —un código 2xx significa que la petición se atendió— y
porque un cliente que confía en el estado termina mostrando datos que no existen como si
fueran válidos. Las otras dos inconsistencias (crear con `200` en vez de `201` y aceptar
creación sin título) son igualmente defectos del contrato, pero afectan un momento específico
del flujo; la del `404` envenena la operación que cualquier consumidor ejecuta primero.