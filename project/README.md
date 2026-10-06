# Proyecto transversal — sistema de gestión de solicitudes

Carpeta reservada para el **proyecto final integrado** de la materia
**Desarrollo Backend** (ITSU).

## Por qué está vacía

El curso exige que el sistema crezca clase a clase y que cada proyecto sea único. Por eso
los proyectos viven dentro de la carpeta de su entrega:

| Clase | Proyecto |
| --- | --- |
| 02 | [`../activities/class-02/project/`](../activities/class-02/project/) — API Full, tres endpoints y contrato HTTP. |
| 03 | [`../activities/class-03/project/`](../activities/class-03/project/) — cuatro endpoints, máquina de estados con 409 y filtros. |
| 07 | [`../activities/class-07/project/`](../activities/class-07/project/) — manejo central de errores, request ID, logs, `/health` y `/ready`. |
| 08 | [`../activities/class-08/`](../activities/class-08/) — refactor por capas y FEATURE-801 (`POST /requests/:id/claim`). |

Aquí se integrará el sistema definitivo al cierre del trimestre, con la estructura que pide
la materia:

```txt
project/
├── README.md
├── src/
├── tests/
└── docs/
    └── architecture/    ← registro de decisiones arquitectónicas
```

## Estado

⬜ Pendiente — se crea al integrar las capacidades de las clases 04 a 11
(persistencia, autenticación, permisos, pruebas y despliegue).
