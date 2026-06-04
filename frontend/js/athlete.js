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

    let currentMonday = null;
    let isExistingPlan = false;

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

    function showConfirmModal(title, message, confirmText = 'Aceptar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modalDiv = document.createElement('div');
            modalDiv.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] opacity-0 transition-opacity duration-200';
            
            modalDiv.innerHTML = `
                <div class="bg-white dark:bg-surface-dim rounded-xl max-w-sm w-full p-6 space-y-4 shadow-lg transform scale-95 transition-transform duration-200">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-xl">warning</span>
                        </div>
                        <div class="space-y-1">
                            <h4 class="font-bold text-on-surface text-base">${title}</h4>
                            <p class="text-xs text-secondary leading-relaxed">${message}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" id="confirm-cancel-btn" class="px-4 py-2 text-xs font-semibold text-secondary hover:bg-gray-50 rounded-lg transition-colors">
                            ${cancelText}
                        </button>
                        <button type="button" id="confirm-ok-btn" class="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-container hover:text-primary rounded-lg transition-colors shadow-sm">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalDiv);
            
            setTimeout(() => {
                modalDiv.classList.remove('opacity-0');
                const box = modalDiv.querySelector('.transform');
                if (box) box.classList.remove('scale-95');
            }, 10);
            
            function close(result) {
                modalDiv.classList.add('opacity-0');
                const box = modalDiv.querySelector('.transform');
                if (box) box.classList.add('scale-95');
                setTimeout(() => {
                    modalDiv.remove();
                    resolve(result);
                }, 200);
            }
            
            modalDiv.querySelector('#confirm-cancel-btn').addEventListener('click', () => close(false));
            modalDiv.querySelector('#confirm-ok-btn').addEventListener('click', () => close(true));
            
            modalDiv.addEventListener('click', (e) => {
                if (e.target === modalDiv) {
                    close(false);
                }
            });
        });
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
        planData.sessions[currentDay] = {
            ...planData.sessions[currentDay],
            exercises: exercises
        };
    }
    function renderDayExercises() {
        currentDayHeader.textContent = `Ejercicios - Día ${currentDay}`;
        exercisesContainer.innerHTML = '';
        
        const dayState = planData.sessions[currentDay] || { exercises: [] };
        const isReadOnly = dayState.status === 'completado';
        
        // Mostrar aviso si la sesión ya está completada
        const alertBanner = document.getElementById('completed-session-alert');
        if (isReadOnly) {
            if (!alertBanner) {
                const banner = document.createElement('div');
                banner.id = 'completed-session-alert';
                banner.className = 'bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-semibold mb-4 border border-emerald-200 flex items-center gap-1.5';
                banner.innerHTML = '<span class="material-symbols-outlined text-sm">lock</span> Esta sesión ya fue completada por el atleta y es de sólo lectura.';
                exercisesContainer.parentElement.insertBefore(banner, exercisesContainer);
            }
            // Ocultar botón de añadir ejercicio si es lectura
            if (addExerciseBtn) addExerciseBtn.classList.add('hidden');
        } else {
            if (alertBanner) alertBanner.remove();
            if (addExerciseBtn) addExerciseBtn.classList.remove('hidden');
        }
        
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
            addExerciseCard('Sentadilla', null, isReadOnly); // Añade uno por defecto si está vacío
        } else {
            exercisesList.forEach(exName => {
                addExerciseCard(exName, grouped[exName], isReadOnly);
            });
        }
    }

    // Crear una tarjeta de ejercicio en el formulario
    function addExerciseCard(exName = 'Sentadilla', setsData = null, isReadOnly = false) {
        const cardId = Date.now() + Math.random().toString(36).substr(2, 5);
        const numSets = setsData ? setsData.length : 3;
        
        const disabledAttr = isReadOnly ? 'disabled readonly' : '';
        const selectClass = isReadOnly ? 'bg-gray-100 border-none rounded-lg h-9 text-xs px-2 font-bold text-gray-500 cursor-not-allowed' : 'bg-white border-none rounded-lg h-9 text-xs px-2 select-exercise font-bold text-on-surface';
        const setsSelectClass = isReadOnly ? 'bg-gray-100 border-none rounded-lg h-8 text-[11px] px-1.5 text-gray-500 cursor-not-allowed' : 'bg-white border-none rounded-lg h-8 text-[11px] px-1.5 select-sets-count';
        
        const deleteBtnHtml = isReadOnly ? '' : `
            <button type="button" class="text-red-500 hover:text-red-700 flex items-center gap-0.5 text-xs font-semibold" onclick="document.getElementById('ex-card-${cardId}').remove()">
                <span class="material-symbols-outlined text-sm">delete</span> Quitar
            </button>
        `;

        const card = document.createElement('div');
        card.className = 'bg-gray-50 border p-4 rounded-xl space-y-4 relative card-shadow';
        card.id = `ex-card-${cardId}`;
        card.innerHTML = `
            <div class="flex justify-between items-center border-b pb-2">
                <div class="flex gap-4 items-center">
                    <select class="${selectClass}" ${disabledAttr} required>
                        <option value="Sentadilla" ${exName === 'Sentadilla' ? 'selected' : ''}>Sentadilla</option>
                        <option value="Press Banca" ${exName === 'Press Banca' ? 'selected' : ''}>Press Banca</option>
                        <option value="Peso Muerto" ${exName === 'Peso Muerto' ? 'selected' : ''}>Peso Muerto</option>
                        <option value="Press Militar" ${exName === 'Press Militar' ? 'selected' : ''}>Press Militar</option>
                    </select>
                    <div class="flex items-center gap-1.5">
                        <label class="text-[10px] font-bold text-secondary uppercase">Series:</label>
                        <select class="${setsSelectClass}" ${disabledAttr}>
                            <option value="1" ${numSets === 1 ? 'selected' : ''}>1</option>
                            <option value="2" ${numSets === 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${numSets === 3 ? 'selected' : ''}>3</option>
                            <option value="4" ${numSets === 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${numSets === 5 ? 'selected' : ''}>5</option>
                        </select>
                    </div>
                </div>
                ${deleteBtnHtml}
            </div>
            <div class="grid grid-cols-12 gap-3 text-[10px] font-bold text-secondary uppercase px-1">
                <div class="col-span-2">Serie</div>
                <div class="col-span-3">Peso (kg)</div>
                <div class="col-span-3">Reps</div>
                <div class="col-span-4">RPE Objetivo</div>
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

        if (setsCountSelect) {
            setsCountSelect.addEventListener('change', updateSetRows);
            setsCountSelect.value = numSets;
        }
        
        // Forzar generación inicial
        for (let s = 1; s <= numSets; s++) {
            const setObj = setsData && setsData[s-1] ? setsData[s-1] : { planned_weight: 80, planned_reps: 5, planned_rpe: 8 };
            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-3 items-center';
            row.dataset.setNumber = s;
            
            const inputClass = isReadOnly ? 'w-full bg-gray-100 border-none rounded-lg h-10 text-sm px-3 text-gray-500 font-semibold cursor-not-allowed' : 'w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-weight font-semibold text-on-surface';
            const inputRepsClass = isReadOnly ? 'w-full bg-gray-100 border-none rounded-lg h-10 text-sm px-3 text-gray-500 cursor-not-allowed' : 'w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-reps text-on-surface';
            const inputRpeClass = isReadOnly ? 'w-full bg-gray-100 border-none rounded-lg h-10 text-sm px-3 text-gray-500 cursor-not-allowed' : 'w-full bg-white border-none rounded-lg h-10 text-sm px-3 input-rpe text-on-surface';

            row.innerHTML = `
                <div class="col-span-2 text-xs font-bold text-secondary">Serie ${s}</div>
                <div class="col-span-3">
                    <input type="number" class="${inputClass}" placeholder="Peso" value="${setObj.planned_weight}" ${disabledAttr} required />
                </div>
                <div class="col-span-3">
                    <input type="number" class="${inputRepsClass}" placeholder="Reps" value="${setObj.planned_reps}" ${disabledAttr} required />
                </div>
                <div class="col-span-4">
                    <input type="number" class="${inputRpeClass}" placeholder="RPE" step="0.5" value="${setObj.planned_rpe}" ${disabledAttr} required />
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

    function updateFreqSelectOptions(completedCount) {
        const select = document.getElementById('planFreqDays');
        if (!select) return;
        
        for (let option of select.options) {
            const val = parseInt(option.value);
            if (val < completedCount) {
                option.disabled = true;
                option.text = `${val} día${val > 1 ? 's' : ''}/semana (Bloqueado: ${completedCount} ya completado${completedCount > 1 ? 's' : ''})`;
            } else {
                option.disabled = false;
                option.text = `${val} día${val > 1 ? 's' : ''}/semana`;
            }
        }
    }

    // 4. Configurar eventos del Modal
    async function openPlanningModal(mondayDate) {
        currentDay = 1;
        isExistingPlan = false;
        planWeekStart.value = formatDateToYYYYMMDD(mondayDate);
        planFreqDays.value = '3';
        
        // Inicializar estado del plan vacío
        planData.week_start_date = planWeekStart.value;
        planData.sessions = {};
        
        // Intentar precargar plan de la semana si ya existe
        await fetchExistingPlan();
        
        const completedCount = Object.values(planData.sessions).filter(s => s.status === 'completado').length;
        updateFreqSelectOptions(completedCount);
        
        renderDayTabs();
        renderDayExercises();
        planModal.classList.remove('hidden');
    }

    if (programBtn) {
        programBtn.addEventListener('click', () => {
            openPlanningModal(currentMonday);
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
            
            const completedCount = Object.values(planData.sessions).filter(s => s.status === 'completado').length;
            updateFreqSelectOptions(completedCount);
            
            renderDayTabs();
            renderDayExercises();
        });
    }

    async function fetchExistingPlan() {
        try {
            isExistingPlan = false;
            const response = await apiFetch(`/athletes/${athleteId}/plans/week?date=${planWeekStart.value}`);
            if (response && response.status !== 'not_found') {
                isExistingPlan = true;
                // Cargar datos del plan existente
                planData.frequency_days = response.frequency_days;
                planFreqDays.value = response.frequency_days.toString();
                planData.sessions = {};
                
                response.sessions.forEach(sess => {
                    planData.sessions[sess.day_number] = {
                        status: sess.status,
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

    // Cargar Planificación de la Semana
    async function loadWeeklyPlan() {
        const weeklyContainer = document.getElementById('weekly-plan-container');
        const currentWeekRange = document.getElementById('currentWeekRange');
        if (!weeklyContainer || !currentWeekRange) return;

        try {
            const mondayStr = formatDateToYYYYMMDD(currentMonday);
            
            // Calcular Domingo
            const sunday = new Date(currentMonday);
            sunday.setDate(sunday.getDate() + 6);
            
            currentWeekRange.textContent = `${currentMonday.getDate()}/${currentMonday.getMonth()+1} al ${sunday.getDate()}/${sunday.getMonth()+1}`;

            const plan = await apiFetch(`/athletes/${athleteId}/plans/week?date=${mondayStr}`);
            weeklyContainer.innerHTML = '';

            if (!plan || plan.status === 'not_found') {
                weeklyContainer.className = "col-span-full bg-white border rounded-xl p-8 text-center text-secondary card-shadow flex flex-col items-center justify-center";
                
                // Calcular semana anterior
                const prevMon = new Date(currentMonday);
                prevMon.setDate(prevMon.getDate() - 7);
                const prevMonStr = formatDateToYYYYMMDD(prevMon);
                
                // Consultar si hay plan en la semana anterior
                let hasPrevPlan = false;
                try {
                    const prevPlan = await apiFetch(`/athletes/${athleteId}/plans/week?date=${prevMonStr}`);
                    if (prevPlan && prevPlan.status !== 'not_found') {
                        hasPrevPlan = true;
                    }
                } catch(e) {
                    console.error("Error al buscar plan de la semana anterior", e);
                }

                const copyBtnHtml = hasPrevPlan ? `
                    <button type="button" id="copy-prev-week-btn" class="mt-3 text-primary font-bold hover:underline flex items-center justify-center gap-1.5 text-xs bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg transition-all active:scale-[0.98] shadow-sm">
                        <span class="material-symbols-outlined text-[16px]">content_copy</span> Copiar planificación de la semana anterior
                    </button>
                ` : '';

                weeklyContainer.innerHTML = `
                    <span class="material-symbols-outlined text-5xl opacity-40 mb-2">calendar_today</span>
                    <p class="font-body-md">No hay entrenamiento planificado para esta semana.</p>
                    <div class="flex flex-col items-center gap-2 mt-4">
                        <button type="button" id="plan-this-week-btn" class="bg-primary hover:bg-surface-tint text-white px-6 py-2.5 rounded-lg font-label-md text-label-md active:scale-95 transition-transform shadow-md">
                            Planificar esta semana
                        </button>
                        ${copyBtnHtml}
                    </div>
                `;
                
                document.getElementById('plan-this-week-btn').addEventListener('click', () => {
                    openPlanningModal(currentMonday);
                });
                
                if (hasPrevPlan) {
                    document.getElementById('copy-prev-week-btn').addEventListener('click', async () => {
                        try {
                            const res = await apiFetch('/plans/copy', {
                                method: 'POST',
                                body: JSON.stringify({
                                    athlete_id: parseInt(athleteId),
                                    source_week: prevMonStr,
                                    target_week: mondayStr
                                })
                            });
                            if (res.status === 'success') {
                                showToast('¡Rutina de la semana anterior clonada exitosamente!');
                                loadWeeklyPlan();
                            }
                        } catch (err) {
                            showToast('Error al copiar plan: ' + err.message, true);
                        }
                    });
                }
                return;
            }

            weeklyContainer.className = "grid grid-cols-1 md:grid-cols-3 gap-6 col-span-full";
            
            plan.sessions.forEach(session => {
                // Agrupar ejercicios por nombre
                const grouped = {};
                session.exercises.forEach(ex => {
                    if (!grouped[ex.exercise]) {
                        grouped[ex.exercise] = [];
                    }
                    grouped[ex.exercise].push(ex);
                });

                let exercisesHtml = '';
                Object.values(grouped).forEach(exGroup => {
                    let setsListHtml = '';
                    exGroup.forEach(set => {
                        let actualHtml = '';
                        if (session.status === 'completado' && set.actual_weight !== null) {
                            const fatigueColor = set.fatigue_status === 'Rojo' ? 'text-red-600 bg-red-100' :
                                                 set.fatigue_status === 'Amarillo' ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100';
                            actualHtml = `
                                <div class="text-right flex items-center gap-1.5 ml-2 mt-0.5">
                                    <span class="font-bold text-emerald-700">${set.actual_weight}kg x ${set.actual_reps}</span>
                                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold ${fatigueColor}">RPE ${set.actual_rpe}</span>
                                </div>
                            `;
                        }
                        
                        setsListHtml += `
                            <div class="flex justify-between items-start py-1 text-xs text-secondary pl-3 border-l-2 border-gray-200">
                                <div>
                                    <span class="block">Serie ${set.set_number}: <span class="font-semibold text-gray-500">${set.planned_weight}kg x ${set.planned_reps} @ RPE ${set.planned_rpe}</span></span>
                                </div>
                                ${actualHtml}
                            </div>
                        `;
                    });

                    exercisesHtml += `
                        <div class="py-1.5 space-y-1">
                            <h4 class="font-bold text-on-surface text-xs">${exGroup[0].exercise}</h4>
                            <div class="space-y-0.5">${setsListHtml}</div>
                        </div>
                    `;
                });

                const badgeColor = session.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
                
                const sessionCard = `
                    <div class="bg-white border rounded-xl p-5 card-shadow space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center border-b pb-2">
                                <div>
                                    <h4 class="font-bold text-on-surface text-sm">Día ${session.day_number}</h4>
                                    <span class="text-[10px] text-secondary block">${session.date}</span>
                                </div>
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] ${badgeColor} font-bold">${session.status === 'pendiente' ? 'Pendiente' : 'Completado'}</span>
                            </div>
                            <div class="space-y-1 divide-y">
                                ${exercisesHtml}
                            </div>
                        </div>
                    </div>
                `;
                weeklyContainer.innerHTML += sessionCard;
            });

            // Si el plan completo está pendiente, mostramos botones de Editar y Eliminar abajo
            if (plan.status === 'pendiente') {
                const hasCompletedSessions = plan.sessions.some(s => s.status === 'completado');
                const deleteBtnHtml = hasCompletedSessions ? '' : `
                    <button type="button" id="delete-weekly-plan-btn" class="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded-lg font-label-md text-label-md active:scale-95 transition-transform hover:bg-red-100">
                        Eliminar Plan Semanal
                    </button>
                `;

                const actionsCard = document.createElement('div');
                actionsCard.className = 'col-span-full flex gap-4 justify-end mt-2';
                actionsCard.innerHTML = `
                    <button type="button" id="edit-weekly-plan-btn" class="bg-surface-container-low text-primary border border-primary/20 px-6 py-2 rounded-lg font-label-md text-label-md active:scale-95 transition-transform hover:bg-surface-container-high">
                        Modificar Plan Semanal
                    </button>
                    ${deleteBtnHtml}
                `;
                weeklyContainer.appendChild(actionsCard);

                document.getElementById('edit-weekly-plan-btn').addEventListener('click', () => {
                    openPlanningModal(currentMonday);
                });

                const deleteBtn = document.getElementById('delete-weekly-plan-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async () => {
                        const confirmDelete = await showConfirmModal(
                            '¿Eliminar planificación?',
                            '¿Estás seguro de que deseas eliminar la planificación de esta semana de forma permanente?',
                            'Sí, eliminar',
                            'Cancelar'
                        );
                        if (confirmDelete) {
                            try {
                                const res = await apiFetch(`/plans/${plan.id}`, { method: 'DELETE' });
                                if (res.status === 'success') {
                                    showToast('Plan semanal eliminado correctamente.');
                                    loadWeeklyPlan();
                                }
                            } catch (err) {
                                showToast('Error al eliminar plan: ' + err.message, true);
                            }
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Error al cargar plan semanal:', error);
            weeklyContainer.innerHTML = '<p class="text-center col-span-full py-4 text-red-600">Error al cargar la planificación semanal.</p>';
        }
    }

    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentMonday.setDate(currentMonday.getDate() - 7);
            loadWeeklyPlan();
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentMonday.setDate(currentMonday.getDate() + 7);
            loadWeeklyPlan();
        });
    }

    // 5. Guardar Plan Semanal Completo
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const completedCount = Object.values(planData.sessions).filter(s => s.status === 'completado').length;
            const numDays = parseInt(planFreqDays.value);
            if (numDays < completedCount) {
                showToast(`La frecuencia semanal (${numDays} días) no puede ser menor a las sesiones ya completadas por el atleta (${completedCount} días)`, true);
                return;
            }
            
            if (isExistingPlan) {
                const confirmSave = await showConfirmModal(
                    '¿Sobrescribir planificación?',
                    'Ya existe una planificación para esta semana. ¿Estás seguro de que deseas sobrescribir o guardar las modificaciones en el plan existente?',
                    'Sí, guardar',
                    'Cancelar'
                );
                if (!confirmSave) return;
            }
            
            saveCurrentDayState();

            // Formatear sesiones
            const sessions = [];
            
            for (let d = 1; d <= numDays; d++) {
                const dayState = planData.sessions[d] || { exercises: [] };
                if (dayState.exercises.length === 0) {
                    showToast(`Por favor configura ejercicios para el Día ${d}`, true);
                    return;
                }

                // Calcular fecha basada en lunes de inicio
                const dateParts = planData.week_start_date.split('-');
                const baseDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                
                // Distribución inteligente de días dentro de la misma semana
                let offset = 0;
                if (numDays === 2) {
                    offset = (d === 1) ? 0 : 3; // Lunes, Jueves
                } else if (numDays === 3) {
                    offset = (d - 1) * 2; // Lunes, Miércoles, Viernes
                } else if (numDays === 4) {
                    const offsets = [0, 1, 3, 4]; // Lunes, Martes, Jueves, Viernes
                    offset = offsets[d - 1];
                } else if (numDays === 5) {
                    const offsets = [0, 1, 2, 4, 5]; // Lunes, Martes, Miércoles, Viernes, Sábado
                    offset = offsets[d - 1];
                } else {
                    offset = d - 1; // Consecutivos para 1, 6 o 7 días
                }
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
                    loadWeeklyPlan();
                }
            } catch (error) {
                showToast('Error al guardar el plan semanal: ' + error.message, true);
            }
        });
    }

    // Inicializar carga de datos
    currentMonday = getMondayOfDate(new Date());
    loadAthleteData();
    loadWeeklyPlan();
});
