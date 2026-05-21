# 📋 Planificación MVP — RPE Flow

## 🎯 Objetivo del proyecto
Desarrollar una web app simple para feria educativa/tecnológica que permita:
* Registrar entrenamientos.
* Utilizar RPE (Rating of Perceived Exertion).
* Mostrar progresión.
* Recomendar ajustes de carga.
* Visualizar datos de manera clara.

El objetivo **NO** es crear una plataforma completa tipo TeamBuildr, sino un MVP funcional, visualmente atractivo y demostrable en pocos minutos. 🚀

---

## 💡 Concepto de la app
Sistema de autorregulación del entrenamiento basado en RPE para entrenadores y atletas.

### El entrenador:
1. Inicia sesión.
2. Accede a su panel.
3. Ve una lista de atletas.
4. Consulta el estado de fatiga y progreso de cada atleta.

### El atleta (simulado):
1. Registra una sesión de entrenamiento (ejercicio, peso, reps, RPE).
2. La app analiza rendimiento, recomienda progresión, detecta fatiga y muestra gráficos.

---

## 💎 Propuesta de valor
Ayuda a los atletas a:
* Entrenar con más criterio.
* Progresar mejor.
* Visualizar evolución.
* Evitar exceso de fatiga.

---

## 🔍 Alcance del MVP

### ✅ Incluye
* Login simple para entrenador (coach / 1234).
* Panel del entrenador con lista de atletas.
* Registro de entrenamiento por atleta.
* Selección de ejercicios de fuerza (Sentadilla, Press banca, Peso muerto, Press militar).
* Sistema de recomendación automática.
* Historial y Dashboard con gráficos (Chart.js).
* Indicador de fatiga (Semáforo: Verde/Amarillo/Rojo).
* Diseño responsive.

### ❌ No incluye
* Registro público de usuarios / Recuperación de contraseña.
* Multiusuario complejo / Permisos avanzados.
* Rutinas complejas / IA real / Integraciones externas.
* App mobile nativa.

---

## 📏 Reglas de Negocio

### 📈 Reglas de progresión
| Condición | Acción |
| :--- | :--- |
| **Subir carga:** Reps completadas + RPE ≤ 7 | +2.5 kg |
| **Mantener carga:** RPE 8–9 | Mantener peso |
| **Bajar carga:** RPE 10 o fallo técnico | Reducir carga |

### 🚦 Indicador de fatiga
* 🟢 **Verde:** RPE 6–7
* 🟡 **Amarillo:** RPE 8–9
* 🔴 **Rojo:** RPE 10

---

## 🛠️ Arquitectura técnica
* **Frontend:** HTML, CSS, Vanilla JS.
* **Backend:** Python, Flask.
* **Base de datos:** SQLite.
* **Librerías:** Chart.js.

---

## 📂 Estructura de Base de Datos (Tablas)
1. **coaches:** `id, username, password, name`
2. **athletes:** `id, coach_id, name, objective`
3. **workouts:** `id, athlete_id, exercise, weight, reps, rpe, date, recommendation, fatigue_status`

---

## 🚀 Flujo de demo en la feria
1. **Login:** Entrar con `coach` / `1234`.
2. **Dashboard:** Mostrar lista de atletas y alertas de fatiga.
3. **Detalle:** Seleccionar un atleta y ver su progreso.
4. **Registro:** Cargar un entrenamiento nuevo.
5. **Resultado:** Mostrar la recomendación automática y actualización de gráficos.

---

## 📝 Notas adicionales
* **Atletas precargados:** Juan Pérez, Martina López, Diego Ruiz.
* **Pitch:** *"Desarrollamos una web app para entrenadores que permite monitorear atletas, registrar entrenamientos y controlar la fatiga mediante RPE, recomendando ajustes de carga de forma simple e inteligente."*
