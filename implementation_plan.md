# Propuesta de Flujo Coherente de Planificación y Carga de RPE

Esta propuesta define un flujo robusto y profesional (inspirado en plataformas reales como TrainHeroic, TrueCoach y Teambuildr) para evitar parches constantes en el código y asegurar que el entrenador administre correctamente los planes y el atleta los cargue de manera inequívoca.

---

## User Review Required

> [!IMPORTANT]
> **Cambios en la Base de Datos (Breaking Changes en Schema)**
> * Añadiremos un índice único `UNIQUE(athlete_id, week_start_date)` en la tabla `plans`. Esto impedirá a nivel de base de datos que existan múltiples planes para el mismo atleta en la misma semana.
> * Implementaremos validaciones estrictas en el backend ([app.py](file:///home/sergio/Documents/src/rpe-flow/backend/app.py)) para rechazar cualquier sesión que tenga una fecha fuera del rango de la semana del plan.

> [!TIP]
> **Flujo Inspirado en TrainHeroic & TrueCoach**
> * **Planificación:** El entrenador define una plantilla semanal. Si ya existe un plan, al intentar crear uno nuevo se le ofrecerá la opción de **Sobrescribir** o **Modificar** el existente, cargando los datos automáticamente en el modal.
> * **Carga del Atleta:** El atleta verá su semana y solo podrá cargar sesiones cuyas fechas sean iguales o anteriores a la fecha actual (evitando cargas de entrenamientos futuros).
> * **Bloqueo de Datos:** Una vez que el atleta completa una sesión, esta queda bloqueada para edición en su panel (solo lectura) y se habilita la comparativa visual en el panel del entrenador.

---

## Decisiones de Diseño y Flujo de Datos

Hemos estructurado y detallado el flujo completo tanto para inversores (conceptual) como para desarrollo (técnico) en el archivo de especificaciones:
👉 **[workflow_specification.md](file:///home/sergio/Documents/src/rpe-flow/workflow_specification.md)**

A partir de tu feedback, acordamos las siguientes reglas del flujo:
1. **Modificación de planes en curso:** Sí, si el atleta ya empezó la semana (completó la sesión 1), el entrenador puede modificar el plan semanal, pero **solo las sesiones que aún están en estado "pendiente"**. Lo ya realizado queda bloqueado como registro inmutable del atleta.
2. **Registro de RPE por Ejercicio:** Sí, simplificaremos la carga. En lugar de tener un slider de RPE por cada serie, el atleta registrará el peso/reps de cada serie y **un único slider de RPE para el ejercicio completo** (Squat, Bench Press, etc.).
3. **Clonación de Planificaciones:** Sí, añadiremos un botón para que el entrenador pueda **Copiar el plan de la semana anterior** con un solo clic para acelerar la carga.

---

## Proposed Changes

### Database Layer
#### [MODIFY] [schema.sql](file:///home/sergio/Documents/src/rpe-flow/backend/database/schema.sql)
* Añadir restricción de unicidad para evitar duplicados:
  ```sql
  UNIQUE(athlete_id, week_start_date)
  ```

---

### Backend (API REST)
#### [MODIFY] [app.py](file:///home/sergio/Documents/src/rpe-flow/backend/app.py)
* **Validación de Fechas en `/api/plans`:** Validar que la fecha (`date`) de cada sesión dentro del plan pertenezca estrictamente a la semana que comienza en `week_start_date` (entre el lunes y el domingo correspondientes).
* **Manejo de Sobrescritura / Actualización:** Si se recibe un plan para una semana que ya existe y está `pendiente`, se limpiarán limpiamente las sesiones previas y se insertará la nueva planificación. Si está `completado`, se rechazará con un error descriptivo.
* **Endpoint de Copiado:** Crear un endpoint `/api/plans/copy` que reciba `athlete_id`, `source_week` y `target_week` para clonar planificaciones rápidamente.

---

### Frontend (Vista Entrenador)
#### [MODIFY] [athlete.html](file:///home/sergio/Documents/src/rpe-flow/frontend/athlete.html)
#### [MODIFY] [athlete.js](file:///home/sergio/Documents/src/rpe-flow/frontend/js/athlete.js)
* **Visualización de Carga vs Real:** Mostrar de forma visual la comparativa por serie (ej: barra verde de RPE realizado vs línea de RPE objetivo) en la planificación de la semana seleccionada.
* **Control de Modificación:** Reemplazar el botón genérico "Programar Sesión" del perfil por acciones contextuales sobre la semana visualizada:
  * Si la semana está vacía: Mostrar botón principal **"Planificar Semana"** (abre modal vacío).
  * Si la semana tiene plan pendiente: Mostrar botones **"Modificar Rutina"** y **"Eliminar Rutina"** (con confirmación).
  * Si la semana está completada: Mostrar badge de **"Rutina Completada"** y deshabilitar edición.
* **Importación:** Añadir botón de "Copiar de semana anterior" en el modal de planificación.

---

### Frontend (Vista Atleta)
#### [MODIFY] [athlete-dashboard.js](file:///home/sergio/Documents/src/rpe-flow/frontend/js/athlete-dashboard.js)
#### [MODIFY] [athlete-dashboard.html](file:///home/sergio/Documents/src/rpe-flow/frontend/athlete-dashboard.html)
* **Bloqueo por Fecha:** Deshabilitar la acción de "Registrar" (icono de play) para días futuros. El atleta no puede registrar sesiones que aún no han ocurrido.
* **Guía Visual de RPE (Tooltips/Leyendas):** Agregar un panel de referencia rápida que explique qué significa cada nivel de RPE (ej: RPE 10 = Esfuerzo Máximo, RPE 8 = 2 repeticiones en reserva, etc.) al lado del slider para asegurar consistencia en los datos del atleta.

---

## Verification Plan

### Automated Tests
* Escribir un script de prueba unitaria en Python (`test_api.py`) que intente:
  1. Guardar un plan con sesiones fuera de rango de fechas (debe retornar error 400).
  2. Guardar planes duplicados para la misma semana (debe ser bloqueado por la base de datos / validación).
  3. Ejecutar y validar la copia de planes de una semana a otra.

### Manual Verification
1. Entrar como Entrenador y programar planes navegando por diferentes semanas. Validar que la interfaz muestre el estado correcto según la semana elegida.
2. Entrar como Atleta y verificar que no se permita hacer clic o registrar rutinas futuras.
3. Verificar que al deslizar el RPE se visualicen los textos de ayuda/leyenda correspondientes.
