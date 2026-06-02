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
    const currentWeekRange = document.getElementById('currentWeekRange');
    const calendarDaysGrid = document.getElementById('calendar-days-grid');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    
    const completionFormCard = document.getElementById('completion-form-card');
    const noPlanSelected = document.getElementById('no-plan-selected');
    const completePlanForm = document.getElementById('completePlanForm');
    const formExercisesContainer = document.getElementById('formExercisesContainer');
    const completedPlansContainer = document.getElementById('completed-plans-container');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Video Modal Elements
    const videoModal = document.getElementById('videoModal');
    const closeVideoModalBtn = document.getElementById('closeVideoModal');
    const videoIframe = document.getElementById('videoIframe');

    // Estado del Calendario (Semana actual)
    let currentMonday = getMondayOfDate(new Date());

    // Helper functions
    function getMondayOfDate(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajusta cuando es Domingo
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

    // Cargar semana e historial
    async function loadDashboardData() {
        try {
            const mondayStr = formatDateToYYYYMMDD(currentMonday);
            
            // Fin de semana (Domingo)
            const sunday = new Date(currentMonday);
            sunday.setDate(sunday.getDate() + 6);
            
            // Actualizar etiqueta del rango de semana
            currentWeekRange.textContent = `${currentMonday.getDate()}/${currentMonday.getMonth()+1} al ${sunday.getDate()}/${sunday.getMonth()+1}`;

            // 2. Fetch Plan Semanal
            const planResponse = await apiFetch(`/athletes/${athleteId}/plans/week?date=${mondayStr}`);
            
            calendarDaysGrid.innerHTML = '';
            
            // Generar los 7 días de la semana
            const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            
            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(currentMonday);
                dayDate.setDate(dayDate.getDate() + i);
                const dayDateStr = formatDateToYYYYMMDD(dayDate);
                
                // Buscar si hay sesión planificada para esta fecha
                let session = null;
                if (planResponse && planResponse.sessions) {
                    session = planResponse.sessions.find(s => s.date === dayDateStr);
                }

                const dayRow = document.createElement('div');
                dayRow.className = 'flex justify-between items-center py-3.5 px-2 hover:bg-gray-50 transition-colors';
                
                let sessionBadge = '<span class="text-xs text-gray-400">Descanso</span>';
                let actionBtnHtml = '';

                if (session) {
                    if (session.status === 'pendiente') {
                        sessionBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">Pendiente</span>';
                        dayRow.classList.add('cursor-pointer');
                        dayRow.addEventListener('click', () => selectSessionForCompletion(session));
                    } else {
                        sessionBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">Completado</span>';
                    }
                }

                dayRow.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="text-center w-10">
                            <span class="text-[10px] uppercase text-secondary font-bold block">${weekdays[i].substring(0, 3)}</span>
                            <span class="text-lg font-bold text-on-surface leading-tight">${dayDate.getDate()}</span>
                        </div>
                        <div>
                            <span class="text-sm font-semibold text-on-surface block">${session ? `Día ${session.day_number}: Rutina` : 'Descanso'}</span>
                            <span class="text-xs text-secondary block">${dayDateStr}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${sessionBadge}
                        ${session && session.status === 'pendiente' ? '<span class="material-symbols-outlined text-orange-600 text-lg">play_arrow</span>' : ''}
                    </div>
                `;

                calendarDaysGrid.appendChild(dayRow);
            }

            // 3. Cargar Historial
            const history = await apiFetch(`/athletes/${athleteId}/history`);
            completedPlansContainer.innerHTML = '';

            if (history.length === 0) {
                completedPlansContainer.innerHTML = '<p class="text-secondary text-sm col-span-2 py-4">Aún no has completado entrenamientos.</p>';
            } else {
                history.forEach(session => {
                    // Agrupar por ejercicio
                    const grouped = {};
                    session.exercises.forEach(ex => {
                        if (!grouped[ex.exercise]) {
                            grouped[ex.exercise] = [];
                        }
                        grouped[ex.exercise].push(ex);
                    });

                    let exercisesHtml = '';
                    Object.values(grouped).forEach(exGroup => {
                        let setsHtml = '';
                        exGroup.forEach(set => {
                            const statusColor = set.fatigue_status === 'Rojo' ? 'text-red-600 bg-red-100' :
                                                set.fatigue_status === 'Amarillo' ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100';
                            
                            setsHtml += `
                                <div class="flex justify-between items-center py-1 text-[11px] text-secondary pl-3 border-l">
                                    <span>Serie ${set.set_number}: Plan: ${set.planned_weight}kg x ${set.planned_reps}</span>
                                    <div class="flex gap-2 items-center">
                                        <span class="font-bold text-on-surface">${set.actual_weight}kg x ${set.actual_reps}</span>
                                        <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold ${statusColor}">RPE ${set.actual_rpe}</span>
                                    </div>
                                </div>
                            `;
                        });

                        exercisesHtml += `
                            <div class="py-1.5 space-y-1">
                                <h5 class="font-bold text-on-surface text-xs">${exGroup[0].exercise}</h5>
                                <div class="space-y-0.5">${setsHtml}</div>
                            </div>
                        `;
                    });

                    const historyCard = document.createElement('div');
                    historyCard.className = 'bg-white border rounded-xl p-5 card-shadow space-y-3';
                    historyCard.innerHTML = `
                        <div class="flex justify-between items-center border-b pb-2">
                            <div>
                                <h4 class="font-bold text-on-surface text-sm">Sesión del Día ${session.day_number}</h4>
                                <span class="text-[10px] text-secondary">Fecha: ${session.date} • Semana del Lunes: ${session.week_start_date}</span>
                            </div>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">Completado</span>
                        </div>
                        <div class="space-y-1 divide-y">
                            ${exercisesHtml}
                        </div>
                    `;
                    completedPlansContainer.appendChild(historyCard);
                });
            }

        } catch (error) {
            console.error('Error al cargar dashboard de atleta:', error);
        }
    }

    // 4. Seleccionar sesión del calendario para registrar
    function selectSessionForCompletion(session) {
        document.getElementById('completeSessionId').value = session.id;
        document.getElementById('formSessionTitle').textContent = `Día ${session.day_number}: Registrar Entrenamiento`;
        document.getElementById('formPlanMeta').textContent = `Fecha planificada: ${session.date}`;
        
        formExercisesContainer.innerHTML = '';
        
        // Agrupar ejercicios por nombre para mostrarlos organizados por tarjeta
        const grouped = {};
        session.exercises.forEach(ex => {
            if (!grouped[ex.exercise]) {
                grouped[ex.exercise] = {
                    name: ex.exercise,
                    video_url: ex.video_url,
                    sets: []
                };
            }
            grouped[ex.exercise].sets.push(ex);
        });

        Object.values(grouped).forEach(exGroup => {
            const exDiv = document.createElement('div');
            exDiv.className = 'bg-gray-50 border p-4 rounded-xl space-y-4 relative card-shadow';
            
            const videoBtn = exGroup.video_url ? `
                <button type="button" class="text-primary hover:text-surface-tint flex items-center gap-0.5 text-xs font-semibold" onclick="playVideo('${exGroup.video_url}')">
                    <span class="material-symbols-outlined text-[15px]">play_circle</span> Ver Video
                </button>
            ` : '';

            exDiv.innerHTML = `
                <div class="flex justify-between items-center border-b pb-2">
                    <h5 class="font-bold text-on-surface text-base">${exGroup.name}</h5>
                    ${videoBtn}
                </div>
                <div class="space-y-4 sets-container">
                    <!-- Dynamic sets rows will be here -->
                </div>
            `;

            const setsContainer = exDiv.querySelector('.sets-container');
            
            exGroup.sets.forEach(set => {
                const setRow = document.createElement('div');
                setRow.className = 'border-b last:border-0 pb-3 last:pb-0 space-y-3';
                setRow.dataset.exerciseId = set.id;
                setRow.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-bold text-secondary">Serie ${set.set_number}</span>
                        <span class="text-[11px] text-gray-500">Plan: ${set.planned_weight}kg x ${set.planned_reps} @ RPE ${set.planned_rpe}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-semibold text-secondary">Peso Realizado (kg)</label>
                            <input type="number" class="w-full bg-white border-none rounded-lg h-10 px-3 text-sm font-semibold text-on-surface input-actual-weight" step="0.5" value="${set.planned_weight}" required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-semibold text-secondary">Repeticiones</label>
                            <input type="number" class="w-full bg-white border-none rounded-lg h-10 px-3 text-sm text-on-surface input-actual-reps" value="${set.planned_reps}" required />
                        </div>
                    </div>
                    <div class="space-y-1 pt-1">
                        <div class="flex justify-between items-end">
                            <label class="text-[10px] font-bold text-secondary">RPE de la Serie</label>
                            <span class="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full val-rpe" id="val-rpe-${set.id}">7</span>
                        </div>
                        <input type="range" min="1" max="10" step="0.5" value="7" class="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-600 slider-rpe" id="slider-rpe-${set.id}" />
                    </div>
                `;

                // Listener del slider RPE por serie
                const slider = setRow.querySelector('.slider-rpe');
                const valLabel = setRow.querySelector('.val-rpe');
                slider.addEventListener('input', (e) => {
                    valLabel.textContent = e.target.value;
                });

                setsContainer.appendChild(setRow);
            });

            formExercisesContainer.appendChild(exDiv);
        });

        noPlanSelected.classList.add('hidden');
        completionFormCard.classList.remove('hidden');
        // Scroll suave al formulario
        completionFormCard.scrollIntoView({ behavior: 'smooth' });
    }

    // 5. Guardar Sesión Completada
    if (completePlanForm) {
        completePlanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const sessionId = document.getElementById('completeSessionId').value;
            const exerciseContainers = formExercisesContainer.children;
            const completedExercises = [];

            for (let container of exerciseContainers) {
                const setRows = container.querySelector('.sets-container').children;
                for (let row of setRows) {
                    const exId = parseInt(row.dataset.exerciseId);
                    const actual_weight = parseFloat(row.querySelector('.input-actual-weight').value);
                    const actual_reps = parseInt(row.querySelector('.input-actual-reps').value);
                    const actual_rpe = parseFloat(row.querySelector('.slider-rpe').value);

                    completedExercises.push({
                        id: exId,
                        actual_weight,
                        actual_reps,
                        actual_rpe
                    });
                }
            }

            try {
                const response = await apiFetch(`/sessions/${sessionId}/complete`, {
                    method: 'POST',
                    body: JSON.stringify({
                        exercises: completedExercises
                    })
                });

                if (response.status === 'success') {
                    showToast('¡Sesión registrada con éxito! Tus progresiones han sido calculadas.');
                    completionFormCard.classList.add('hidden');
                    noPlanSelected.classList.remove('hidden');
                    loadDashboardData();
                }
            } catch (error) {
                showToast('Error al guardar entrenamiento: ' + error.message, true);
            }
        });
    }

    // 6. Configurar Video Modal
    window.playVideo = function(videoUrl) {
        videoIframe.src = videoUrl;
        videoModal.classList.remove('hidden');
    };

    if (closeVideoModalBtn) {
        closeVideoModalBtn.addEventListener('click', () => {
            videoModal.classList.add('hidden');
            videoIframe.src = ''; // Detiene la reproducción
        });
    }

    // 7. Navegación de semanas del calendario
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentMonday.setDate(currentMonday.getDate() - 7);
            loadDashboardData();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentMonday.setDate(currentMonday.getDate() + 7);
            loadDashboardData();
        });
    }

    // 8. Salir
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Inicializar
    loadDashboardData();
});
