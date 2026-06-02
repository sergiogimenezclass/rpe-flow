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
#### **HU-2.1: Carga de Plan de Entrenamiento**
* **Como** Entrenador,
* **Quiero** programar planes de entrenamiento compuestos por distintos ejercicios para mis atletas,
* **Para** estructurar las rutinas de fuerza que deben realizar.
* **Criterios de Aceptación:**
  - El entrenador cuenta con un botón "Programar Sesión" en la vista de detalle de cada atleta.
  - Al presionarlo, se despliega un formulario que permite definir:
    - **Fecha** del entrenamiento.
    - **Frecuencia** semanal (ej. 3 veces por semana).
    - **Ejercicios** (se pueden añadir dinámicamente múltiples filas de ejercicios).
    - Para cada ejercicio se especifica: **Peso planeado (kg)**, **Repeticiones planeadas** y **RPE objetivo**.
  - Al guardar, el plan se registra en estado "pendiente" para el atleta seleccionado.

---

### 🏋️‍♂️ Épica 3: Ejecución y Registro (Atleta)
#### **HU-3.1: Visualización de Rutinas Pendientes**
* **Como** Atleta,
* **Quiero** ver una lista de las rutinas de entrenamiento pendientes que mi entrenador me programó,
* **Para** saber qué debo entrenar hoy.
* **Criterios de Aceptación:**
  - Al ingresar a `athlete-dashboard.html`, se listan todos los planes que están en estado "pendiente".
  - Cada tarjeta de plan muestra la fecha, la frecuencia y los ejercicios asignados.

#### **HU-3.2: Registro de Resultados Reales y RPE**
* **Como** Atleta,
* **Quiero** registrar el peso real, repeticiones reales y RPE percibido en cada ejercicio del plan,
* **Para** completar mi entrenamiento y enviar los datos a mi entrenador.
* **Criterios de Aceptación:**
  - Al seleccionar un plan pendiente, se abre el formulario de registro con los ejercicios planificados.
  - Los campos de peso y repeticiones vienen pre-completados con los valores planificados por el entrenador, pero son editables.
  - El atleta ingresa de manera obligatoria el **RPE real** percibido (valor de 1 a 10) usando un control deslizante o selector.
  - Al guardar la rutina, el plan pasa a estado "completado".
  - Se calculan automáticamente las alertas de fatiga (Verde, Amarillo, Rojo) y las sugerencias de carga para la próxima sesión basados en el RPE real.

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
