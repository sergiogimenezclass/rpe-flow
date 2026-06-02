document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del atleta
    const urlParams = new URLSearchParams(window.location.search);
    const athleteId = urlParams.get('id');
    if (!athleteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Verificar sesión de coach
    const coach = JSON.parse(localStorage.getItem('coach'));
    if (!coach) {
        window.location.href = 'index.html';
        return;
    }

    // Elementos DOM
    const planModal = document.getElementById('planModal');
    const programBtn = document.getElementById('program-session-btn');
    const closePlanModalBtn = document.getElementById('closePlanModal');
    const planForm = document.getElementById('planForm');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const exercisesContainer = document.getElementById('exercisesContainer');
    const planWeekStart = document.getElementById('planWeekStart');
    const planFreqDays = document.getElementById('planFreqDays');
    const dayTabsContainer = document.getElementById('dayTabsContainer');
    const currentDayHeader = document.getElementById('currentDayHeader');

    // Estado del plan en edición
    let currentDay = 1;
    let planData = {
        athlete_id: parseInt(athleteId),
        week_start_date: '',
        frequency_days: 3,
        sessions: {} // mapea day_number -> { exercises: [] }
    };

    // Toast feedback function
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const msg = document.getElementById('toast-msg');
        
        msg.textContent = message;
        if (isError) {
            toast.classList.replace('bg-emerald-600', 'bg-red-600');
            icon.textContent = 'error';
        } else {
            toast.classList.replace('bg-red-600', 'bg-emerald-600');
            icon.textContent = 'check_circle';
        }
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 50);
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    function getMondayOfDate(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(date.setDate(diff));
        mon.setHours(0,0,0,0);
        return mon;
    }

    function formatDateToYYYYMMDD(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // 2. Cargar detalles del atleta e historial
    async function loadAthleteData() {
        try {
            const athletes = await apiFetch('/athletes');
            const athlete = athletes.find(a => a.id == athleteId);
            
            if (!athlete) {
                showToast('Atleta no encontrado', true);
                window.location.href = 'dashboard.html';
                return;
            }

            document.getElementById('athlete-name').textContent = athlete.name;
            document.getElementById('athlete-objective').textContent = `Meta: ${athlete.objective}`;

            // Obtener historial detallado por serie
            const history = await apiFetch(`/athletes/${athleteId}/history`);
            const historyContainer = document.getElementById('history-container');
            historyContainer.innerHTML = '';

            if (history.length === 0) {
                historyContainer.innerHTML = '<p class="text-center text-secondary py-6">No hay entrenamientos completados aún.</p>';
                return;
            }

            history.forEach(session => {
                // Agrupar ejercicios por nombre para mostrarlos estructuradamente
                const groupedExercises = {};
                session.exercises.forEach(ex => {
                    if (!groupedExercises[ex.exercise]) {
                        groupedExercises[ex.exercise] = {
                            name: ex.exercise,
                            video_url: ex.video_url,
                            sets: []
                        };
                    }
                    groupedExercises[ex.exercise].sets.push(ex);
                });

                let exercisesHtml = '';
                Object.values(groupedExercises).forEach(exGroup => {
                    let setsListHtml = '';
                    exGroup.sets.forEach(set => {
                        const statusColor = set.fatigue_status === 'Rojo' ? 'text-red-600 bg-red-100' :
                                            set.fatigue_status === 'Amarillo' ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100';
                        
                        setsListHtml += `
                            <div class="flex justify-between items-center py-1.5 text-xs text-secondary pl-4 border-l-2 border-gray-200">
                                <span>Serie ${set.set_number}: Plan: ${set.planned_weight}kg x ${set.planned_reps} @ RPE ${set.planned_rpe}</span>
                                <div class="text-right flex items-center gap-2">
                                    <span class="font-bold text-on-surface">${set.actual_weight}kg x ${set.actual_reps}</span>
                                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor}">RPE ${set.actual_rpe}</span>
                                    <span class="text-[9px] font-medium text-gray-500">${set.recommendation || ''}</span>
                                </div>
                            </div>
                        `;
                    });

                    const videoBtn = exGroup.video_url ? `
                        <button type="button" class="text-primary hover:text-surface-tint flex items-center gap-1 text-xs" onclick="window.open('${exGroup.video_url}', '_blank')">
                            <span class="material-symbols-outlined text-sm">play_circle</span> Técnica
                        </button>
                    ` : '';

                    exercisesHtml += `
                        <div class="py-2.5 space-y-1.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-bold text-on-surface text-sm">${exGroup.name}</h4>
                                ${videoBtn}
                            </div>
                            <div class="space-y-1">
                                ${setsListHtml}
                            </div>
                        </div>
                    `;
                });

                const planHtml = `
                    <div class="bg-white rounded-xl p-6 card-shadow space-y-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start border-b pb-3">
                            <div>
                                <h3 class="font-bold text-on-surface text-base">Entrenamiento Completado (Día ${session.day_number})</h3>
                                <p class="text-xs text-secondary mt-1">Fecha: ${session.date} • Plan de la semana del Lunes: ${session.week_start_date}</p>
                            </div>
                            <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">Completado</span>
                        </div>
                        <div class="space-y-2 divide-y">
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

    // 3. Generar Tabs de días según frecuencia
    function renderDayTabs() {
        const numDays = parseInt(planFreqDays.value);
        planData.frequency_days = numDays;
        
        dayTabsContainer.innerHTML = '';
        for (let i = 1; i <= numDays; i++) {
            const tabBtn = document.createElement('button');
            tabBtn.type = 'button';
            tabBtn.className = `px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                i === currentDay 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-gray-50 text-secondary border-gray-200 hover:bg-gray-100'
            }`;
            tabBtn.textContent = `Día ${i}`;
            tabBtn.addEventListener('click', () => {
                saveCurrentDayState();
                currentDay = i;
                renderDayExercises();
                renderDayTabs(); // refresh tab styles
            });
            dayTabsContainer.appendChild(tabBtn);
        }
    }

    // Guardar los datos del formulario actual en memoria
    function saveCurrentDayState() {
        const exercises = [];
        const exerciseCards = exercisesContainer.children;

        for (let card of exerciseCards) {
            const exercise = card.querySelector('.select-exercise').value;
            const setsContainer = card.querySelector('.sets-rows-container');
            const setRows = setsContainer.children;
            
            for (let row of setRows) {
                const set_number = parseInt(row.dataset.setNumber);
                const planned_weight = parseFloat(row.querySelector('.input-weight').value) || 0;
                const planned_reps = parseInt(row.querySelector('.input-reps').value) || 0;
                const planned_rpe = parseFloat(row.querySelector('.input-rpe').value) || 8;

                exercises.push({
                    exercise,
                    set_number,
                    planned_weight,
                    planned_reps,
                    planned_rpe
                });
            }
        }
        planData.sessions[currentDay] = { exercises };
    }

    // Renderizar ejercicios del día seleccionado
    function renderDayExercises() {
        currentDayHeader.textContent = `Ejercicios - Día ${currentDay}`;
        exercisesContainer.innerHTML = '';
        
        const dayState = planData.sessions[currentDay] || { exercises: [] };
        
        // Agrupar ejercicios por nombre para reconstruir las tarjetas
        const grouped = {};
        dayState.exercises.forEach(ex => {
            if (!grouped[ex.exercise]) {
                grouped[ex.exercise] = [];
            }
            grouped[ex.exercise].push(ex);
        });

        const exercisesList = Object.keys(grouped);
        if (exercisesList.length === 0) {
            addExerciseCard(); // Añade uno por defecto si está vacío
        } else {
            exercisesList.forEach(exName => {
                addExerciseCard(exName, grouped[exName]);
            });
        }
    }

    // Crear una tarjeta de ejercicio en el formulario
    function addExerciseCard(exName = 'Sentadilla', setsData = null) {
        const cardId = Date.now() + Math.random().toString(36).substr(2, 5);
        const numSets = setsData ? setsData.length : 3;

        const card = document.createElement('div');
        card.className = 'bg-gray-50 border p-4 rounded-xl space-y-4 relative card-shadow';
        card.id = `ex-card-${cardId}`;
        card.innerHTML = `
            <div class="flex justify-between items-center border-b pb-2">
                <div class="flex gap-4 items-center">
                    <select class="bg-white border-none rounded-lg h-9 text-xs px-2 select-exercise font-bold text-on-surface" required>
                        <option value="Sentadilla" ${exName === 'Sentadilla' ? 'selected' : ''}>Sentadilla</option>
                        <option value="Press Banca" ${exName === 'Press Banca' ? 'selected' : ''}>Press Banca</option>
                        <option value="Peso Muerto" ${exName === 'Peso Muerto' ? 'selected' : ''}>Peso Muerto</option>
                        <option value="Press Militar" ${exName === 'Press Militar' ? 'selected' : ''}>Press Militar</option>
                    </select>
                    <div class="flex items-center gap-1.5">
                        <label class="text-[10px] font-bold text-secondary uppercase">Series:</label>
                        <select class="bg-white border-none rounded-lg h-8 text-[11px] px-1.5 select-sets-count">
                            <option value="1" ${numSets === 1 ? 'selected' : ''}>1</option>
                            <option value="2" ${numSets === 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${numSets === 3 ? 'selected' : ''}>3</option>
                            <option value="4" ${numSets === 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${numSets === 5 ? 'selected' : ''}>5</option>
                        </select>
                    </div>
                </div>
                <button type="button" class="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-xs font-semibold" onclick="document.getElementById('ex-card-${cardId}').remove()">
                    <span class="material-symbols-outlined text-sm">delete</span> Quitar
                </button>
            </div>
            <div class="space-y-3 sets-rows-container">
                <!-- Set rows will be here -->
            </div>
        `;

        const setsContainer = card.querySelector('.sets-rows-container');
        const setsCountSelect = card.querySelector('.select-sets-count');

        // Generar filas de series
        function updateSetRows() {
            const count = parseInt(setsCountSelect.value);
            const currentRows = setsContainer.children;
            const currentCount = currentRows.length;

            if (count > currentCount) {
                // Agregar filas adicionales
                for (let s = currentCount + 1; s <= count; s++) {
                    const setObj = setsData && setsData[s-1] ? setsData[s-1] : { planned_weight: 80, planned_reps: 5, planned_rpe: 8 };
                    const row = document.createElement('div');
                    row.className = 'grid grid-cols-12 gap-3 items-center';
                    row.dataset.setNumber = s;
                    row.innerHTML = `
                        <div class="col-span-2 text-xs font-bold text-secondary">Serie ${s}</div>
                        <div class="col-span-3">
                            <input type="number" class="w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-weight font-semibold text-on-surface" placeholder="Peso (kg)" value="${setObj.planned_weight}" required />
                        </div>
                        <div class="col-span-3">
                            <input type="number" class="w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-reps text-on-surface" placeholder="Reps" value="${setObj.planned_reps}" required />
                        </div>
                        <div class="col-span-4">
                            <input type="number" class="w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-rpe text-on-surface" placeholder="RPE" step="0.5" value="${setObj.planned_rpe}" required />
                        </div>
                    `;
                    setsContainer.appendChild(row);
                }
            } else if (count < currentCount) {
                // Eliminar sobrantes
                for (let s = currentCount; s > count; s--) {
                    setsContainer.removeChild(currentRows[s-1]);
                }
            }
        }

        setsCountSelect.addEventListener('change', updateSetRows);
        
        // Cargar las filas iniciales
        setsCountSelect.value = numSets;
        // Forzar generación inicial
        for (let s = 1; s <= numSets; s++) {
            const setObj = setsData && setsData[s-1] ? setsData[s-1] : { planned_weight: 80, planned_reps: 5, planned_rpe: 8 };
            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-3 items-center';
            row.dataset.setNumber = s;
            row.innerHTML = `
                <div class="col-span-2 text-xs font-bold text-secondary">Serie ${s}</div>
                <div class="col-span-3">
                    <input type="number" class="w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-weight font-semibold text-on-surface" placeholder="Peso" value="${setObj.planned_weight}" required />
                </div>
                <div class="col-span-3">
                    <input type="number" class="w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-reps text-on-surface" placeholder="Reps" value="${setObj.planned_reps}" required />
                </div>
                <div class="col-span-4">
                    <input type="number" class="w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-rpe text-on-surface" placeholder="RPE" step="0.5" value="${setObj.planned_rpe}" required />
                </div>
            `;
            setsContainer.appendChild(row);
        }

        exercisesContainer.appendChild(card);
    }

    // Listener para agregar más ejercicios en la vista de carga
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', () => addExerciseCard());
    }

    // 4. Configurar eventos del Modal
    if (programBtn) {
        programBtn.addEventListener('click', async () => {
            currentDay = 1;
            const monday = getMondayOfDate(new Date());
            planWeekStart.value = formatDateToYYYYMMDD(monday);
            planFreqDays.value = '3';
            
            // Inicializar estado del plan vacío
            planData.week_start_date = planWeekStart.value;
            planData.sessions = {};
            
            // Intentar precargar plan de la semana si ya existe
            await fetchExistingPlan();
            
            renderDayTabs();
            renderDayExercises();
            planModal.classList.remove('hidden');
        });
    }

    if (closePlanModalBtn) {
        closePlanModalBtn.addEventListener('click', () => {
            planModal.classList.add('hidden');
        });
    }

    if (planFreqDays) {
        planFreqDays.addEventListener('change', () => {
            currentDay = 1;
            renderDayTabs();
            renderDayExercises();
        });
    }

    if (planWeekStart) {
        planWeekStart.addEventListener('change', async () => {
            const parts = planWeekStart.value.split('-');
            const selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const monday = getMondayOfDate(selectedDate);
            planWeekStart.value = formatDateToYYYYMMDD(monday);
            
            planData.week_start_date = planWeekStart.value;
            await fetchExistingPlan();
            renderDayTabs();
            renderDayExercises();
        });
    }

    async function fetchExistingPlan() {
        try {
            const response = await apiFetch(`/athletes/${athleteId}/plans/week?date=${planWeekStart.value}`);
            if (response && response.status !== 'not_found') {
                // Cargar datos del plan existente
                planData.frequency_days = response.frequency_days;
                planFreqDays.value = response.frequency_days.toString();
                planData.sessions = {};
                
                response.sessions.forEach(sess => {
                    planData.sessions[sess.day_number] = {
                        exercises: sess.exercises.map(ex => ({
                            exercise: ex.exercise,
                            set_number: ex.set_number,
                            planned_weight: ex.planned_weight,
                            planned_reps: ex.planned_reps,
                            planned_rpe: ex.planned_rpe
                        }))
                    };
                });
                showToast('Plan semanal existente cargado para edición.');
            }
        } catch (e) {
            console.error('Error al precargar plan existente:', e);
        }
    }

    // 5. Guardar Plan Semanal Completo
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            saveCurrentDayState();

            // Formatear sesiones
            const sessions = [];
            const numDays = planData.frequency_days;
            
            for (let d = 1; d <= numDays; d++) {
                const dayState = planData.sessions[d] || { exercises: [] };
                if (dayState.exercises.length === 0) {
                    showToast(`Por favor configura ejercicios para el Día ${d}`, true);
                    return;
                }

                // Calcular fecha basada en lunes de inicio
                const dateParts = planData.week_start_date.split('-');
                const baseDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                // Espaciar cada día por 2 días de descanso (ej: Lunes, Miércoles, Viernes)
                const offset = (d - 1) * 2;
                baseDate.setDate(baseDate.getDate() + offset);
                
                const yyyy = baseDate.getFullYear();
                const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
                const dd = String(baseDate.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                sessions.push({
                    day_number: d,
                    date: dateStr,
                    exercises: dayState.exercises
                });
            }

            try {
                const response = await apiFetch('/plans', {
                    method: 'POST',
                    body: JSON.stringify({
                        athlete_id: parseInt(athleteId),
                        week_start_date: planWeekStart.value,
                        frequency_days: numDays,
                        sessions
                    })
                });

                if (response.status === 'success') {
                    showToast('¡Plan semanal guardado con éxito!');
                    planModal.classList.add('hidden');
                    loadAthleteData();
                }
            } catch (error) {
                showToast('Error al guardar el plan semanal: ' + error.message, true);
            }
        });
    }

    // Inicializar carga de datos
    loadAthleteData();
});
