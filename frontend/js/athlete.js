document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del atleta
    const urlParams = new URLSearchParams(window.location.search);
    const athleteId = urlParams.get('id');
    if (!athleteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Verificar si hay sesión de coach
    const coach = JSON.parse(localStorage.getItem('coach'));
    if (!coach) {
        window.location.href = 'index.html';
        return;
    }

    const planModal = document.getElementById('planModal');
    const programBtn = document.getElementById('program-session-btn');
    const closePlanModalBtn = document.getElementById('closePlanModal');
    const planForm = document.getElementById('planForm');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const exercisesContainer = document.getElementById('exercisesContainer');

    // 2. Cargar detalles del atleta e historial
    async function loadAthleteData() {
        try {
            // Obtener todos los atletas para buscar el detalle de este en particular
            const athletes = await apiFetch('/athletes');
            const athlete = athletes.find(a => a.id == athleteId);
            
            if (!athlete) {
                alert('Atleta no encontrado');
                window.location.href = 'dashboard.html';
                return;
            }

            // Actualizar cabecera
            document.getElementById('athlete-name').textContent = athlete.name;
            document.getElementById('athlete-objective').textContent = `Meta: ${athlete.objective}`;

            // Obtener historial de entrenamientos (planes completados)
            const history = await apiFetch(`/athletes/${athleteId}/history`);
            const historyContainer = document.getElementById('history-container');
            historyContainer.innerHTML = '';

            if (history.length === 0) {
                historyContainer.innerHTML = '<p class="text-center text-secondary py-6">No hay entrenamientos completados aún.</p>';
                return;
            }

            history.forEach(plan => {
                let exercisesHtml = '';
                plan.exercises.forEach(ex => {
                    const statusColor = ex.fatigue_status === 'Rojo' ? 'text-red-600 bg-red-100' :
                                        ex.fatigue_status === 'Amarillo' ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100';
                    
                    exercisesHtml += `
                        <div class="border-b last:border-0 py-3 flex justify-between items-center text-sm">
                            <div>
                                <span class="font-bold text-on-surface">${ex.exercise}</span>
                                <div class="text-xs text-secondary mt-0.5">
                                    Objetivo: ${ex.planned_weight}kg x ${ex.planned_reps} @ RPE ${ex.planned_rpe}
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="font-bold text-on-surface">${ex.actual_weight}kg x ${ex.actual_reps}</span>
                                <div class="flex gap-2 justify-end mt-1">
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}">RPE ${ex.actual_rpe}</span>
                                    <span class="text-[10px] text-gray-500 font-medium">${ex.recommendation || 'Sin recomendación'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });

                const planHtml = `
                    <div class="bg-white rounded-xl p-6 card-shadow space-y-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start border-b pb-3">
                            <div>
                                <h3 class="font-bold text-on-surface text-lg">Sesión de Entrenamiento</h3>
                                <p class="text-xs text-secondary mt-1">Fecha: ${plan.date} • Frecuencia: ${plan.frequency}</p>
                            </div>
                            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Completado</span>
                        </div>
                        <div class="space-y-1">
                            ${exercisesHtml}
                        </div>
                    </div>
                `;
                historyContainer.innerHTML += planHtml;
            });

        } catch (error) {
            console.error('Error al cargar datos del atleta:', error);
        }
    }

    // 3. Modal - Agregar filas de ejercicios
    function createExerciseRow() {
        const rowId = Date.now();
        const rowHtml = `
            <div class="grid grid-cols-12 gap-2 items-center border p-3 rounded-lg bg-gray-50 relative group" id="ex-row-${rowId}">
                <div class="col-span-4 space-y-1">
                    <label class="text-[10px] font-bold text-secondary uppercase">Ejercicio</label>
                    <select class="w-full bg-white border-none rounded-lg h-9 text-xs px-2 select-exercise" required>
                        <option value="Sentadilla">Sentadilla</option>
                        <option value="Press Banca">Press Banca</option>
                        <option value="Peso Muerto">Peso Muerto</option>
                        <option value="Press Militar">Press Militar</option>
                    </select>
                </div>
                <div class="col-span-2.5 space-y-1">
                    <label class="text-[10px] font-bold text-secondary uppercase">Peso (kg)</label>
                    <input type="number" placeholder="0" class="w-full bg-white border-none rounded-lg h-9 text-xs px-2 input-weight" step="0.5" required />
                </div>
                <div class="col-span-2.5 space-y-1">
                    <label class="text-[10px] font-bold text-secondary uppercase">Reps</label>
                    <input type="number" placeholder="0" class="w-full bg-white border-none rounded-lg h-9 text-xs px-2 input-reps" required />
                </div>
                <div class="col-span-2 space-y-1">
                    <label class="text-[10px] font-bold text-secondary uppercase">RPE Obj</label>
                    <input type="number" placeholder="8" min="1" max="10" step="0.5" class="w-full bg-white border-none rounded-lg h-9 text-xs px-2 input-rpe" required />
                </div>
                <button type="button" onclick="document.getElementById('ex-row-${rowId}').remove()" class="col-span-1 text-red-500 hover:text-red-700 pt-5 flex justify-center">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rowHtml;
        exercisesContainer.appendChild(tempDiv.firstElementChild);
    }

    // Eventos del modal
    if (programBtn) {
        programBtn.addEventListener('click', () => {
            // Limpiar y abrir modal
            exercisesContainer.innerHTML = '';
            createExerciseRow(); // Añadir primera fila por defecto
            document.getElementById('planDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('planFrequency').value = '3 veces por semana';
            planModal.classList.remove('hidden');
        });
    }

    if (closePlanModalBtn) {
        closePlanModalBtn.addEventListener('click', () => {
            planModal.classList.add('hidden');
        });
    }

    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', createExerciseRow);
    }

    // Guardar plan
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const date = document.getElementById('planDate').value;
            const frequency = document.getElementById('planFrequency').value;

            // Recopilar ejercicios
            const exerciseRows = exercisesContainer.children;
            const exercises = [];

            for (let row of exerciseRows) {
                const exercise = row.querySelector('.select-exercise').value;
                const planned_weight = parseFloat(row.querySelector('.input-weight').value);
                const planned_reps = parseInt(row.querySelector('.input-reps').value);
                const planned_rpe = parseFloat(row.querySelector('.input-rpe').value);

                exercises.push({ exercise, planned_weight, planned_reps, planned_rpe });
            }

            try {
                const response = await apiFetch('/plans', {
                    method: 'POST',
                    body: JSON.stringify({
                        athlete_id: parseInt(athleteId),
                        date,
                        frequency,
                        exercises
                    })
                });

                if (response.status === 'success') {
                    alert('¡Plan programado con éxito!');
                    planModal.classList.add('hidden');
                    loadAthleteData();
                }
            } catch (error) {
                alert('Error al programar plan: ' + error.message);
            }
        });
    }

    // Inicializar
    loadAthleteData();
});
