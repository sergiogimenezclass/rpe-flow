# 📝 Historias de Usuario — RPE Flow

Este documento detalla las historias de usuario para el flujo básico de planificación por parte del entrenador y registro/calificación de esfuerzo (RPE) por parte del atleta.

---

## 👥 Roles
* **Entrenador (Coach):** Planifica los entrenamientos para los atletas y supervisa su fatiga y progreso.
* **Atleta:** Inicia sesión de forma independiente, visualiza su plan de entrenamiento asignado, lo realiza y registra los datos reales y el RPE percibido.

---

## 📖 Historias de Usuario

### 🔒 Épica 1: Autenticación e Identidad
#### **HU-1.1: Inicio de Sesión Independiente**
* **Como** Entrenador o Atleta,
* **Quiero** tener mi propio inicio de sesión con usuario y contraseña,
* **Para** acceder de manera segura a mi correspondiente panel de control.
* **Criterios de Aceptación:**
  - El sistema cuenta con un único formulario de login en `index.html`.
  - Si las credenciales corresponden a un entrenador (ej: `coach`), redirige a la vista del entrenador (`dashboard.html`).
  - Si las credenciales corresponden a un atleta (ej: `juan`), redirige a la vista del atleta (`athlete-dashboard.html`).

#### **HU-1.2: Perfil del Atleta (Vista Coach)**
* **Como** Entrenador,
* **Quiero** poder ver los perfiles individuales de mis atletas asignados,
* **Para** conocer sus metas y hacer un seguimiento detallado de su evolución.
* **Criterios de Aceptación:**
  - En la tabla general de atletas, al hacer clic en un atleta, el entrenador es redirigido a una vista detallada (`athlete.html?id=ID`).
  - La vista detallada muestra el nombre del atleta, su meta u objetivo principal, su historial y gráficos de progreso.

---

### 📋 Épica 2: Planificación (Entrenador)
#### **HU-2.1: Carga y Modificación de Plan Semanal**
* **Como** Entrenador,
* **Quiero** programar y modificar planes de entrenamiento semanales con una cantidad variable de días y ejercicios para mis atletas,
* **Para** adaptar las rutinas de fuerza semana a semana.
* **Criterios de Aceptación:**
  - El entrenador cuenta con una opción de "Programar Semana" en el perfil de cada atleta.
  - Al crear el plan, se define:
    - **Semana de Planificación** (semana calendario seleccionada).
    - **Cantidad de días de entrenamiento** para esa semana (ej. 3 días, configurable dinámicamente).
    - **Días de la semana sugeridos** (ej: Lunes, Miércoles, Viernes) o enumeración simple (Día 1, Día 2, Día 3).
  - Por cada día de entrenamiento de la semana, se pueden añadir múltiples ejercicios, definiendo para cada serie: **Peso planeado (kg)**, **Repeticiones planeadas** y **RPE objetivo**.
  - **Edición a Futuro**: El entrenador puede ingresar a un plan semanal ya creado y modificar la cantidad de días, cambiar ejercicios u objetivos siempre y cuando el atleta no haya completado esa sesión de entrenamiento.
  - Al guardar, las sesiones pendientes se publican en el calendario del atleta para esa semana.
  - **Requisitos de UI/UX:**
    - **Legibilidad de Inputs**: Los campos de entrada de datos (especialmente de números como peso y repeticiones) deben tener un tamaño de fuente legible (mínimo 14px) y anchos adaptados para evitar que los números queden cortados o resulten muy pequeños en pantallas de cualquier tamaño.
    - **Feedback Integrado (No Alerts)**: La confirmación de plan guardado exitosamente o la indicación de errores en el formulario debe realizarse a través de notificaciones en pantalla integradas al diseño (banners, toasts o mensajes inline), prohibiéndose el uso de diálogos emergentes nativos del navegador (`alert()`).


---

### 🏋️‍♂️ Épica 3: Ejecución y Registro (Atleta)
#### **HU-3.1: Calendario de Rutinas y Frecuencia**
* **Como** Atleta,
* **Quiero** contar con un calendario interactivo que refleje la frecuencia y los días planificados de mi rutina,
* **Para** seleccionar cualquier fecha y ver la rutina asignada de ese día.
* **Criterios de Aceptación:**
  - En `athlete-dashboard.html`, se renderiza una sección de **Calendario de Entrenamientos** interactivo.
  - La frecuencia de entrenamiento definida por el entrenador (ej. 3 veces por semana) destaca visualmente los días planificados o programados en el calendario.
  - Al hacer clic en un día que contiene un plan "pendiente", se abre el formulario de registro correspondiente.
  - Permite la navegación del calendario para consultar rutinas pasadas y futuras.

#### **HU-3.2: Registro Detallado por Serie (Set/Repeticiones)**
* **Como** Atleta,
* **Quiero** registrar el peso y RPE para cada serie de forma individual,
* **Para** documentar de manera precisa la variación de esfuerzo en cada serie de mi ejercicio.
* **Criterios de Aceptación:**
  - El formulario de registro despliega **una fila de inputs por cada serie** planificada para el ejercicio.
  - Los campos de peso y repeticiones vienen pre-completados con los valores planificados para esa serie, pero se pueden modificar si el atleta no logró la meta.
  - Cada serie cuenta con su propio control deslizante/slider de RPE real.
  - Al guardar, el plan pasa a "completado" y registra las métricas detalladas por serie.
  - **Requisitos de UI/UX:**
    - **Control Deslizante Inteligente**: El control deslizante para el RPE debe tener un tamaño cómodo y fácil de manipular en móviles. Debe actualizar en tiempo real un indicador de texto grande con el valor seleccionado.
    - **Notificación Integrada (No Alerts)**: Al enviar la rutina completada con éxito, la confirmación debe ser visual e integrada al diseño de la página de forma fluida (sin alerts nativos), indicando al atleta que sus datos fueron transmitidos con éxito al entrenador.

#### **HU-3.3: Video Demostrativo del Ejercicio**
* **Como** Atleta,
* **Quiero** poder reproducir un video demostrativo de la técnica del ejercicio asignado,
* **Para** asegurar la correcta ejecución del movimiento.
* **Criterios de Aceptación:**
  - Junto a cada ejercicio en la vista de rutina y en el formulario de carga, se muestra un acceso rápido (icono de video/play).
  - Al presionarlo, se reproduce de manera integrada (ej. en un modal modal o popup) un video demostrativo del ejercicio.
  - Los enlaces de videos demostrativos vienen pre-configurados para los ejercicios preestablecidos en el sistema.

---

### 📊 Épica 4: Monitoreo (Entrenador)
#### **HU-4.1: Vista Comparativa Planificado vs. Real**
* **Como** Entrenador,
* **Quiero** visualizar en formato de tabla o historial las sesiones de mi atleta comparando el plan original con la ejecución real,
* **Para** evaluar la adherencia del atleta y reajustar cargas en base a la fatiga real.
* **Criterios de Aceptación:**
  - En la sección "Historial de Sesiones" del atleta, el entrenador ve las rutinas completadas.
  - Cada rutina muestra los ejercicios realizados con una comparativa clara: ej: *Sentadilla: Planificado 100kg x 5 @ RPE 8 | Realizado 100kg x 5 @ RPE 7*.
  - Se visualizan las recomendaciones automáticas de ajuste generadas por el sistema.
