document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si hay sesión
    const coach = JSON.parse(localStorage.getItem('coach'));
    if (!coach) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const athletes = await apiFetch('/athletes');
        
        // 1. Actualizar Métricas
        const totalAthletes = athletes.length;
        const highFatigueAthletes = athletes.filter(a => a.last_fatigue === 'Rojo').length;
        
        const rpeValues = athletes.map(a => a.last_rpe).filter(v => v != null);
        const avgRpe = rpeValues.length > 0 
            ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1) 
            : 0;

        document.getElementById('total-athletes').textContent = totalAthletes;
        document.getElementById('high-fatigue').textContent = highFatigueAthletes;
        document.getElementById('avg-rpe').textContent = avgRpe;
        // El de sesiones requiere un endpoint de contador, por ahora lo dejamos en 0 o estimamos
        document.getElementById('total-sessions').textContent = rpeValues.length;

        // 2. Poblar Alertas de Fatiga
        const alertsContainer = document.getElementById('alerts-container');
        alertsContainer.innerHTML = '';

        // Mostramos solo los que tienen RPE cargado, priorizando fatiga alta
        const sortedAthletes = athletes
            .filter(a => a.last_rpe != null)
            .sort((a, b) => b.last_rpe - a.last_rpe);

        sortedAthletes.forEach(athlete => {
            const fatigueColor = athlete.last_fatigue === 'Rojo' ? 'bg-error' : 
                               athlete.last_fatigue === 'Amarillo' ? 'bg-primary-container' : 'bg-emerald-500';
            
            const fatigueBorder = athlete.last_fatigue === 'Rojo' ? 'border-error' : 'border-surface-container';

            const alertHtml = `
                <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-all cursor-pointer group" onclick="window.location.href='athlete.html?id=${athlete.id}'">
                    <div class="w-12 h-12 rounded-full overflow-hidden border-2 ${fatigueBorder}">
                        <img alt="Athlete" class="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.name)}&background=random">
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h3 class="font-label-md text-label-md font-bold text-on-surface">${athlete.name}</h3>
                            <span class="${fatigueColor} text-white text-[10px] px-2 py-0.5 rounded-full font-bold">RPE ${athlete.last_rpe}</span>
                        </div>
                        <p class="text-xs text-secondary">${athlete.objective}</p>
                    </div>
                    <span class="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity" data-icon="chevron_right">chevron_right</span>
                </div>
            `;
            alertsContainer.innerHTML += alertHtml;
        });

        if (sortedAthletes.length === 0) {
            alertsContainer.innerHTML = '<p class="text-center text-secondary font-label-md py-4">No hay datos de entrenamiento recientes.</p>';
        }

    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
});
