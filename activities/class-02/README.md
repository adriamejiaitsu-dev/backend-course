# Clase 02 · HTTP: el contrato entre cliente y servidor

Entrega 02 de Desarrollo Backend. Hay **dos proyectos sobre el mismo recurso** (solicitudes
de mantenimiento): el **Lite** enseña a leer y corregir un contrato ajeno; el **Full**, a
definir un contrato antes de que exista el código. Vence antes del inicio de la clase 3.

## Qué contiene esta carpeta

```txt
activities/class-02/
├── README.md                ← este archivo
├── .gitignore
├── lite-api/                ← API Lite: original (en el historial) + corregida
├── lite-analysis.md         ← análisis de la API Lite con evidencia
├── casos-de-prueba.md       ← casos A/B/C con resultados observados
├── project/                 ← API Full (contrato + código + datos)
├── comparison.md            ← comparación Lite vs Full + reflexión
├── ai-usage.md              ← registro del uso de IA
├── complementos/            ← ticket de salida y actividad comparativa de protocolos
├── lite-evidence-partA.txt  ← outputs crudos de los casos de la Lite original
├── lite-evidence-partB.txt  ← outputs crudos de los casos de la Lite corregida
├── full-evidence-partC.txt  ← outputs crudos de los casos del Full
├── recursos/                ← archivos descargados de la presentación (plantillas, starter)
└── resources/               ← manifests y láminas de los 11 bloques de la clase
```

Los tags de entrega en el historial:

- `class-02-lite-analysis` — el punto donde quedó el análisis de la Lite **antes de** las
  correcciones.
- `class-02-submission` — la entrega completa.

## Cómo instalar y ejecutar

### Lite (`lite-api/`)

```bash
cd lite-api
npm install
npm start        # -> http://localhost:3000
```

### Full (`project/`)

```bash
cd project
npm install
npm start        # -> http://localhost:3000
```

> Ambas usan el puerto 3000: probar una, detenerla (`Ctrl + C`) y probar la otra.

Endpoints (iguales en las dos versiones corregidas):

| Método | Ruta            | Respuestas                                     |
| ------ | --------------- | ---------------------------------------------- |
| GET    | `/requests`     | `200` + arreglo (opcional `?status=open`)      |
| GET    | `/requests/:id` | `200` + solicitud, o `404` si no existe        |
| POST   | `/requests`     | `201` + solicitud creada, o `400` sin `title`  |

## Defectos encontrados en el Lite y su corrección

| # | Defecto observado | Corrección aplicada |
| - | ----------------- | ------------------- |
| 1 | El listado se expone como `GET /getRequests` (verbo) y `GET /requests` no existe | Ruta renombrada a `GET /requests` |
| 2 | `GET /requests/999` responde `200` con cuerpo de error | Ahora responde `404` con `{"error":"Request not found"}` |
| 3 | `POST /requests` responde `200` al crear | Ahora responde `201 Created` |
| 4 | `POST /requests` acepta creación sin `title` y guarda datos incompletos | Ahora valida el título y responde `400` sin guardar nada |

Cada fila tiene fila de origen en `lite-analysis.md` y los casos antes/después en
`casos-de-prueba.md` (Parte A vs Parte B).

## Decisiones del Full

- **Contrato primero**: `project/docs/http-contract.md` se escribió antes de implementar y la
  implementación responde a él.
- **Solo los tres endpoints del alcance**: nada de `PUT`/`PATCH`/`DELETE` ni funcionalidad
  extra.
- **Datos en memoria** en `src/data/requests.js`: se pierden al reiniciar, esperado en este
  incremento.
- **Estructura por responsabilidades**: arranque, configuración, rutas, datos y contrato en
  archivos separados para que cada cambio toque un solo motivo.
- **Exclusiones**: sin base de datos, sin TypeScript, sin autenticación, sin capa de
  controllers/services/repositories, sin dependencias además de Express, sin frontend.

## Uso de IA

Registrado en `ai-usage.md`. Advertencia honesta: el `lite-analysis.md` fue elaborado con
asistencia de IA, lo que **se aparta de la restricción «sin IA en la primera fase»** de la
consigna; el tag `class-02-lite-analysis` debe usarse con ese contexto en cuenta.