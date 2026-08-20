# Análisis del proyecto Lite

> **Completa este documento ANTES de usar cualquier herramienta de IA y ANTES de corregir el
> código.** Es la evidencia de tu análisis independiente. Guárdalo con el tag
> `class-02-lite-analysis`.
>
> El método es siempre el mismo: **ejecutar, observar, registrar**. Usa `curl -i` (o la
> pestaña Network del navegador) para ver la línea de estado, no solo el cuerpo. Ninguna
> conclusión vale sin la respuesta que la respalda.

## 1. Cómo ejecuté la API

Anota el comando que usaste y lo que apareció en la terminal.

```bash

```

## 2. Tabla de análisis

Una fila por cada comportamiento que observaste. Si un mismo endpoint se comporta distinto
según la entrada (por ejemplo, un `id` que existe y uno que no), usa una fila para cada caso.

| Endpoint | Intención | Entrada | Respuesta actual | Problema | Propuesta |
| -------- | --------- | ------- | ---------------- | -------- | --------- |
|          |           |         |                  |          |           |
|          |           |         |                  |          |           |
|          |           |         |                  |          |           |
|          |           |         |                  |          |           |
|          |           |         |                  |          |           |

Cómo llenar cada columna:

* **Endpoint** — método y ruta exactamente como los expone el código.
* **Intención** — qué se supone que hace, en una frase.
* **Entrada** — parámetros de ruta, query o body que enviaste.
* **Respuesta actual** — código de estado **y** cuerpo, copiados de lo que observaste.
* **Problema** — qué contradice el contrato. Si no hay problema, escribe «Correcto».
* **Propuesta** — el comportamiento que debería tener, con su código de estado.

## 3. Evidencia

Pega aquí las peticiones y respuestas que sostienen la tabla. Incluye la línea de estado.

```txt

```

## 4. Preguntas guía

Responde con lo que observaste, no con lo que supones.

1. ¿Qué recurso representa esta API y cómo se nombra en cada una de sus rutas?
2. ¿Qué método HTTP corresponde a cada intención, y coincide con el que usa el código?
3. ¿Qué código de estado devuelve cada respuesta y qué afirma exactamente ese código?
4. ¿Hay alguna respuesta cuyo estado contradiga su propio cuerpo? ¿Cuál y por qué?
5. ¿Qué entradas acepta el servidor sin comprobarlas, y qué consecuencia tiene aceptarlas?
6. ¿Cómo distinguiría un cliente automático un éxito de un error sin leer el cuerpo?
7. ¿Qué parte del comportamiento observado no podía deducirse leyendo solo las rutas?
8. Si otra persona consumiera esta API sin ver el código, ¿qué supuesto la haría fallar?

## 5. Conclusión

En un párrafo: ¿cuál de los problemas encontrados es el más grave para quien consume la API, y
por qué ese y no otro?

_(Completar)_
