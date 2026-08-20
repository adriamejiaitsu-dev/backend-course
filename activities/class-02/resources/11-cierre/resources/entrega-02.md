# Entrega 02 — HTTP como contrato

> **Vence:** antes del inicio de la tercera clase.
> **Tag intermedio:** `class-02-lite-analysis` — se guarda **antes** de usar IA.
> **Tag final:** `class-02-submission`

## Dónde va

En tu repositorio único de la materia:

```txt
activities/class-02/
├── README.md
├── lite-api/
│   ├── package.json
│   └── server.js
├── lite-analysis.md
├── comparison.md
└── ai-usage.md
```

Además, el proyecto Full completo va dentro de la misma carpeta, bajo `project/`:

```txt
activities/class-02/
└── project/
    ├── README.md
    ├── package.json
    ├── docs/
    │   └── http-contract.md
    └── src/
        ├── app.js
        ├── server.js
        ├── routes/
        │   └── requests.routes.js
        └── data/
            └── requests.js
```

No subas `node_modules/`. Añádelo a `.gitignore` si todavía no está.

---

## Qué debe contener la entrega

### 1. API Lite original

La versión de partida, tal como se te entregó, en `lite-api/`. Debe quedar en el historial de
Git antes de cualquier corrección. Es el punto de referencia contra el que se leerá tu
análisis.

### 2. Análisis independiente

`lite-analysis.md`, completado **antes de usar IA y antes de tocar el código**:

* La tabla de análisis (Endpoint · Intención · Entrada · Respuesta actual · Problema ·
  Propuesta), con una fila por comportamiento observado.
* La evidencia: peticiones y respuestas reales, con línea de estado incluida.
* Las respuestas a las ocho preguntas guía.

Este archivo se guarda con el tag `class-02-lite-analysis`.

### 3. API Lite corregida

Las correcciones aplicadas sobre `lite-api/`, en commits posteriores al tag del análisis.
Cada corrección debe poder rastrearse hasta la fila de la tabla que la motivó.

> **La corrección final del Lite no debe eliminar la evidencia del análisis inicial.**
> El análisis, las respuestas observadas y el código original deben seguir siendo visibles en
> el historial y en `lite-analysis.md`. Una entrega que solo muestre el código ya corregido no
> demuestra que hubo análisis: demuestra que hay código que funciona, que no es lo mismo.

### 4. Contrato HTTP del Full

`project/docs/http-contract.md` completo: método, ruta, entrada, respuesta de éxito,
respuestas de error y ejemplo de body para cada endpoint. Escrito **antes** de implementar los
manejadores.

### 5. Proyecto Full

`project/` funcionando, con los tres endpoints implementados:

* `GET /requests` → `200` con el arreglo de solicitudes.
* `GET /requests/:id` → `200` con la solicitud, o `404` si no existe.
* `POST /requests` → `201` con la solicitud creada, o `400` si falta el `title`.

Ningún endpoint debe seguir respondiendo `501`.

**Exclusiones obligatorias.** Sin base de datos, sin TypeScript, sin autenticación, sin capa
de controladores/servicios/repositorios, sin `PUT`, `PATCH` ni `DELETE`, sin dependencias
además de Express, sin frontend.

### 6. Evidencia de ejecución

Los casos de prueba manuales ejecutados y registrados, con el resultado observado de cada uno
(estado y cuerpo). Puede ir en `README.md` o en un `casos-de-prueba.md` dentro de
`activities/class-02/`. Se aceptan capturas de pantalla, pero el texto de las respuestas debe
estar presente.

### 7. Documentación

`README.md` de `activities/class-02/` con:

1. Qué contiene la carpeta y cómo está organizada.
2. Cómo instalar y ejecutar cada proyecto (Lite y Full).
3. Resumen de los defectos encontrados en el Lite y de la corrección aplicada a cada uno.
4. Qué decisiones tomaste en el Full y por qué.

### 8. Uso de IA

`ai-usage.md` con las secciones exactas: `What I asked for`, `What the AI proposed`,
`What I accepted`, `What I changed or rejected`, `How I verified it`,
`What I still do not understand`.

La IA no puede usarse antes del tag `class-02-lite-analysis`. Si la usaste después, debe
quedar registrado aquí; si no la usaste, escríbelo y explica cómo resolviste el proyecto.

### 9. Comparación

`comparison.md` con la tabla de dimensiones (Contrato, Organización, IA, Lectura,
Modificación, Complejidad, Verificación, Extensibilidad) y las catorce preguntas de reflexión
respondidas.

### 10. Reflexión final

Al final de `comparison.md` o del `README.md`: si tuvieras que empezar de nuevo el proyecto
Full, ¿qué harías distinto y por qué?

### 11. Historial progresivo

Commits descriptivos que muestren el recorrido: análisis, corrección, contrato,
implementación, verificación. Un único commit con todo el trabajo no cumple este requisito,
porque borra precisamente lo que se está evaluando: el orden en que tomaste las decisiones.

---

## Cómo entregar

1. Crea la carpeta `activities/class-02/`.
2. Completa `lite-analysis.md` con la API Lite original todavía sin corregir.
3. Marca ese punto del historial:

   ```bash
   git add .
   git commit -m "Analisis independiente de la API Lite"
   git tag class-02-lite-analysis
   ```

4. Continúa con la corrección del Lite, el contrato y el proyecto Full, en commits separados.
5. Cuando todo esté completo:

   ```bash
   git add .
   git commit -m "Entrega clase 02"
   git tag class-02-submission
   git push origin main --tags
   ```

## Criterios de revisión

| Criterio | Qué se mira |
| -------- | ----------- |
| Análisis | Los cuatro defectos identificados con evidencia, antes de usar IA. |
| Contrato | El contrato HTTP escrito antes del código y coherente con la implementación. |
| Implementación | Los tres endpoints funcionando con los códigos de estado correctos. |
| Verificación | Resultados observados registrados, no supuestos. |
| Uso de IA | Registro honesto, con lo aceptado y lo rechazado. |
| Historial | El recorrido visible en los commits y en los dos tags. |
| Exclusiones | Se respetaron todas las restricciones del proyecto Full. |
