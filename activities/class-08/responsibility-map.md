# Responsibility map — Clase 08

Mapa de responsabilidades del handler cargado ANTES de refactorizar.
Complétalo mientras lees `GET /:id/history` en `requests.routes.js`.

## El handler analizado

Ruta/operación: `GET /requests/:id/history`

## Clasificación de bloques

Para cada bloque del handler, anota a qué categoría pertenece y qué líneas
lo forman (aprox.):

| Categoría | ¿Qué hace ese bloque aquí? | ¿A qué archivo debería moverse? |
| --- | --- | --- |
| HTTP (leer params/identidad) | [COMPLETAR] | |
| Aplicación (coordinar el caso) | [COMPLETAR] | |
| Negocio (¿puede verse?) | [COMPLETAR] | |
| Persistencia (SQL) | [COMPLETAR] | |
| Presentación (construir respuesta) | [COMPLETAR] | |
| Observabilidad (errores/requestId) | [COMPLETAR] | |

## Las preguntas del análisis

* ¿Cuántas RAZONES distintas tiene esta función para cambiar?

  [COMPLETAR]

* ¿Qué piezas ya existentes del proyecto duplica? (pista: mira store, mapper y policy)

  [COMPLETAR]

* ¿Qué NO se puede probar de forma aislada mientras todo viva junto?

  [COMPLETAR]
