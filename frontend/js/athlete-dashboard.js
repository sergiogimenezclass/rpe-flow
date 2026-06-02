document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión del atleta
    const athlete = JSON.parse(localStorage.getItem('athlete'));
    if (!athlete) {
        window.location.href = 'index.html';
        return;
    }

    const athleteId = athlete.id;

    // Poblar perfil
    document.getElementById('athlete-profile-name').textContent = athlete.name;
    document.getElementById('welcome-message').textContent = `¡Hola, ${athlete.name.split(' ')[0]}!`;
    document.getElementById('athlete-profile-objective').textContent = `Meta: ${athlete.objective}`;

    // Elementos DOM
    const pendingPlansList = document.getElementById('pending-plans-list');
    const completionFormCard = document.getElementById('completion-form-card');
    const noPlanSelected = document.getElementById('no-plan-selected');
    const completePlanForm = document.getElementById('completePlanForm');
    const formExercisesContainer = document.getElementById('formExercisesContainer');
    const completedPlansContainer = document.getElementById('completed-plans-container');
    const logoutBtn = document.getElementById('logoutBtn');

    // Variables de estado
    let selectedPlan = null;

    // 2. Cargar planes pendientes e historial
    async function loadData() {
        try {
            // Cargar planes pendientes
            const pendingPlans = await apiFetch(`/athletes/${athleteId}/plans/pending`);
            pendingPlansList.innerHTML = '';

            if (pendingPlans.length === 0) {
                pendingPlansList.innerHTML = '<p class="text-secondary text-sm">No tienes rutinas pendientes asignadas por tu entrenador. ¡Buen trabajo! 🎉</p>';
            } else {
                pendingPlans.forEach(plan => {
                    const planCard = document.createElement('div');
                    planCard.className = 'bg-white border rounded-xl p-5 card-shadow cursor-pointer hover:border-orange-500 transition-all space-y-2';
                    planCard.innerHTML = `
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-on-surface">Rutina Planificada</h4>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">Pendiente</span>
                        </div>
                        <p class="text-xs text-secondary">Fecha: ${plan.date} • Frecuencia: ${plan.frequency}</p>
                        <p class="text-xs text-on-surface font-medium mt-1">Ejercicios: ${plan.exercises.map(e => e.exercise).join(', ')}</p>
                    `;
                    planCard.addEventListener('click', () => selectPlanForCompletion(plan));
                    pendingPlansList.appendChild(planCard);
                });
            }

            // Cargar historial completado
            const completedPlans = await apiFetch(`/athletes/${athleteId}/history`);
            completedPlansContainer.innerHTML = '';

            if (completedPlans.length === 0) {
                completedPlansContainer.innerHTML = '<p class="text-secondary text-sm col-span-2">Aún no has completado entrenamientos.</p>';
            } else {
                completedPlans.forEach(plan => {
                    let exercisesHtml = '';
                    plan.exercises.forEach(ex => {
                        const statusColor = ex.fatigue_status === 'Rojo' ? 'text-red-600 bg-red-100' :
                                            ex.fatigue_status === 'Amarillo' ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100';
                        
                        exercisesHtml += `
                            <div class="border-b last:border-0 py-2.5 flex justify-between items-center text-xs">
                                <div>
                                    <span class="font-bold text-on-surface">${ex.exercise}</span>
                                    <div class="text-[10px] text-gray-500">Plan: ${ex.planned_weight}kg x ${ex.planned_reps} @ RPE ${ex.planned_rpe}</div>
                                </div>
                                <div class="text-right">
                                    <span class="font-bold text-on-surface">${ex.actual_weight}kg x ${ex.actual_reps}</span>
                                    <div class="flex gap-1.5 justify-end mt-0.5">
                                        <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold ${statusColor}">RPE ${ex.actual_rpe}</span>
                                        <span class="text-[9px] text-secondary">${ex.recommendation || ''}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    const planCard = document.createElement('div');
                    planCard.className = 'bg-white border rounded-xl p-5 card-shadow space-y-3';
                    planCard.innerHTML = `
                        <div class="flex justify-between items-center border-b pb-2">
                            <div>
                                <h4 class="font-bold text-on-surface text-sm">Entrenamiento Realizado</h4>
                                <span class="text-[10px] text-secondary">Fecha: ${plan.date}</span>
                            </div>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">Completado</span>
                        </div>
                        <div class="space-y-1">
                            ${exercisesHtml}
                        </div>
                    `;
                    completedPlansContainer.appendChild(planCard);
                });
            }

        } catch (error) {
            console.error('Error al cargar datos del atleta:', error);
        }
    }

    // 3. Seleccionar rutina para completar
    function selectPlanForCompletion(plan) {
        selectedPlan = plan;
        document.getElementById('completePlanId').value = plan.id;
        document.getElementById('formPlanMeta').textContent = `Fecha planificada: ${plan.date} • Frecuencia: ${plan.frequency}`;
        
        formExercisesContainer.innerHTML = '';
        
        plan.exercises.forEach(ex => {
            const exDiv = document.createElement('div');
            exDiv.className = 'bg-gray-50 border p-4 rounded-xl space-y-4 relative';
            exDiv.dataset.exerciseId = ex.id;
            
            exDiv.innerHTML = `
                <div class="flex justify-between items-start border-b pb-2">
                    <h5 class="font-bold text-on-surface text-base">${ex.exercise}</h5>
                    <span class="text-xs text-secondary">Guía: ${ex.planned_weight}kg x ${ex.planned_reps} @ RPE ${ex.planned_rpe}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-secondary">Peso Realizado (kg)</label>
                        <input type="number" class="w-full bg-white border-none rounded-lg h-10 px-3 text-sm input-actual-weight" step="0.5" value="${ex.planned_weight}" required />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-secondary">Reps Realizadas</label>
                        <input type="number" class="w-full bg-white border-none rounded-lg h-10 px-3 text-sm input-actual-reps" value="${ex.planned_reps}" required />
                    </div>
                </div>
                <div class="space-y-2 pt-2">
                    <div class="flex justify-between items-end">
                        <label class="text-xs font-semibold text-secondary">Esfuerzo Percibido (RPE Real)</label>
                        <span class="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full val-rpe" id="val-rpe-${ex.id}">7</span>
                    </div>
                    <input type="range" min="1" max="10" step="0.5" value="7" class="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-600 slider-rpe" id="slider-rpe-${ex.id}" />
                </div>
            `;
            
            // Vincular listener del slider RPE
            const slider = exDiv.querySelector('.slider-rpe');
            const valLabel = exDiv.querySelector('.val-rpe');
            slider.addEventListener('input', (e) => {
                valLabel.textContent = e.target.value;
            });
            
            formExercisesContainer.appendChild(exDiv);
        });

        noPlanSelected.classList.add('hidden');
        completionFormCard.classList.remove('hidden');
    }

    // 4. Guardar rutina completada
    if (completePlanForm) {
        completePlanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const planId = document.getElementById('completePlanId').value;
            const exerciseContainers = formExercisesContainer.children;
            const completedExercises = [];

            for (let container of exerciseContainers) {
                const exId = parseInt(container.dataset.exerciseId);
                const actual_weight = parseFloat(container.querySelector('.input-actual-weight').value);
                const actual_reps = parseInt(container.querySelector('.input-actual-reps').value);
                const actual_rpe = parseFloat(container.querySelector('.slider-rpe').value);

                completedExercises.push({
                    id: exId,
                    actual_weight,
                    actual_reps,
                    actual_rpe
                });
            }

            try {
                const response = await apiFetch(`/plans/${planId}/complete`, {
                    method: 'POST',
                    body: JSON.stringify({
                        exercises: completedExercises
                    })
                });

                if (response.status === 'success') {
                    alert('¡Entrenamiento registrado con éxito! Tu entrenador ya puede ver tu fatiga y recomendaciones.');
                    completionFormCard.classList.add('hidden');
                    noPlanSelected.classList.remove('hidden');
                    loadData();
                }
            } catch (error) {
                alert('Error al guardar entrenamiento: ' + error.message);
            }
        });
    }

    // 5. Salir
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Inicializar
    loadData();
});
