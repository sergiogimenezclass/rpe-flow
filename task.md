# Checklist de Ejecución — Flujo de Entrenamiento y RPE

- `[x]` **Capá de Base de Datos:**
  - `[x]` Modificar [schema.sql](file:///home/sergio/Documents/src/rpe-flow/backend/database/schema.sql) para agregar restricción de unicidad `UNIQUE(athlete_id, week_start_date)` en la tabla `plans`.
  - `[x]` Ejecutar script de base de datos para recrearla o aplicar la restricción.
- `[x]` **Backend (API Flask):**
  - `[x]` Implementar validación de rango de fechas de sesiones en `/api/plans` dentro de [app.py](file:///home/sergio/Documents/src/rpe-flow/backend/app.py).
  - `[x]` Implementar endpoint `/api/plans/copy` en [app.py](file:///home/sergio/Documents/src/rpe-flow/backend/app.py).
- `[x]` **Frontend - Vista Entrenador:**
  - `[x]` Actualizar botones y acciones contextuales según el estado de la semana en [athlete.js](file:///home/sergio/Documents/src/rpe-flow/frontend/js/athlete.js) and [athlete.html](file:///home/sergio/Documents/src/rpe-flow/frontend/athlete.html).
  - `[x]` Implementar funcionalidad "Copiar de semana anterior" en el modal de planificación.
- `[x]` **Frontend - Vista Atleta:**
  - `[x]` Bloquear registro de entrenamientos futuros en [athlete-dashboard.js](file:///home/sergio/Documents/src/rpe-flow/frontend/js/athlete-dashboard.js).
  - `[x]` Agregar leyenda visual de niveles de RPE en [athlete-dashboard.html](file:///home/sergio/Documents/src/rpe-flow/frontend/athlete-dashboard.html) y [athlete-dashboard.js](file:///home/sergio/Documents/src/rpe-flow/frontend/js/athlete-dashboard.js).
- `[x]` **Verificación:**
  - `[x]` Crear script de pruebas unitarias `test_api.py`.
  - `[x]` Validar manualmente el flujo completo (entrenador y atleta).
