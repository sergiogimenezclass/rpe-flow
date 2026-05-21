document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('athletes-grid');
    const searchInput = document.getElementById('athlete-search');

    async function loadAthletes() {
        try {
            const athletes = await apiFetch('/athletes');
            renderAthletes(athletes);
            
            // Filtro de búsqueda
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = athletes.filter(a => 
                    a.name.toLowerCase().includes(term) || 
                    a.objective.toLowerCase().includes(term)
                );
                renderAthletes(filtered);
            });
        } catch (error) {
            console.error('Error cargando atletas:', error);
            grid.innerHTML = '<p class="text-center col-span-full py-12 text-secondary">Error al cargar atletas.</p>';
        }
    }

    function renderAthletes(athletes) {
        grid.innerHTML = '';
        
        athletes.forEach(athlete => {
            const fatigueLabel = athlete.last_fatigue || '---';
            const fatigueColor = athlete.last_fatigue === 'Rojo' ? 'bg-red-100 text-red-800' : 
                               athlete.last_fatigue === 'Amarillo' ? 'bg-orange-100 text-orange-800' : 
                               athlete.last_fatigue === 'Verde' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

            const rpeColor = athlete.last_fatigue === 'Rojo' ? 'text-red-600' : 
                            athlete.last_fatigue === 'Amarillo' ? 'text-orange-600' : 'text-primary';

            const card = `
                <div class="bg-white rounded-xl p-6 shadow-sm border border-transparent hover:border-orange-200 transition-all group">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full overflow-hidden shadow-sm">
                                <img class="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.name)}&background=random">
                            </div>
                            <div>
                                <h3 class="font-bold text-on-surface group-hover:text-primary transition-colors">${athlete.name}</h3>
                                <span class="text-xs text-secondary flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[14px]">flag</span>
                                    ${athlete.objective}
                                </span>
                            </div>
                        </div>
                        <div class="${fatigueColor} px-3 py-1 rounded-full text-[10px] font-bold tracking-tight">
                            FATIGA ${fatigueLabel}
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4 flex justify-between items-center mb-6">
                        <div class="text-center flex-1 border-r">
                            <p class="text-[10px] text-secondary uppercase tracking-widest">Último RPE</p>
                            <p class="text-xl font-bold ${rpeColor}">${athlete.last_rpe || '--'}/10</p>
                        </div>
                        <div class="text-center flex-1">
                            <p class="text-[10px] text-secondary uppercase tracking-widest">Sesiones</p>
                            <p class="text-xl font-bold text-on-surface">--</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <a href="athlete.html?id=${athlete.id}" class="bg-gray-100 text-primary font-bold py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors text-center">Ver detalle</a>
                        <a href="log-workout.html?athlete_id=${athlete.id}" class="bg-orange-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors text-center">Registrar</a>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });

        if (athletes.length === 0) {
            grid.innerHTML = '<p class="text-center col-span-full py-12 text-secondary">No se encontraron atletas.</p>';
        }
    }

    loadAthletes();
});
