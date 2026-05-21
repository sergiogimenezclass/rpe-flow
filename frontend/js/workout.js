document.addEventListener('DOMContentLoaded', async () => {
    const athleteSelect = document.getElementById('athlete_id');
    const logForm = document.getElementById('logForm');
    const rpeRange = document.getElementById('rpeRange');
    const rpeValueDisplay = document.getElementById('rpeValue');
    const recommendationCard = document.getElementById('recommendationCard');
    const recommendationText = document.getElementById('recommendationText');
    const submitBtn = document.getElementById('submitBtn');

    // Cargar atletas en el select
    try {
        const athletes = await apiFetch('/athletes');
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedId = urlParams.get('athlete_id');

        athletes.forEach(athlete => {
            const option = document.createElement('option');
            option.value = athlete.id;
            option.textContent = athlete.name;
            if (preselectedId && athlete.id == preselectedId) {
                option.selected = true;
            }
            athleteSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando atletas:', error);
    }

    // Actualizar valor de RPE visualmente
    rpeRange.addEventListener('input', (e) => {
        const val = e.target.value;
        rpeValueDisplay.textContent = val;
        
        if (val <= 7) {
            rpeValueDisplay.className = 'bg-emerald-100 text-emerald-600 font-bold px-3 py-1 rounded-full text-xl';
        } else if (val <= 9) {
            rpeValueDisplay.className = 'bg-orange-100 text-orange-600 font-bold px-3 py-1 rounded-full text-xl';
        } else {
            rpeValueDisplay.className = 'bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-xl';
        }
    });

    // Manejar envío del formulario
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            athlete_id: parseInt(document.getElementById('athlete_id').value),
            exercise: document.getElementById('exercise').value,
            weight: parseFloat(document.getElementById('weight').value),
            reps: parseInt(document.getElementById('reps').value),
            rpe: parseFloat(document.getElementById('rpeRange').value)
        };

        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Guardando...';

        try {
            const response = await apiFetch('/workouts', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (response.status === 'success') {
                recommendationText.innerHTML = `Basado en el RPE de hoy, <span class="font-bold">${response.recommendation}</span> en la próxima sesión.`;
                recommendationCard.classList.remove('hidden');
                recommendationCard.scrollIntoView({ behavior: 'smooth' });
                
                submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> ¡Guardado!';
                submitBtn.className = submitBtn.className.replace('bg-orange-600', 'bg-emerald-600');
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                    submitBtn.className = submitBtn.className.replace('bg-emerald-600', 'bg-orange-600');
                    logForm.reset();
                    rpeValueDisplay.textContent = '7';
                    rpeRange.value = 7;
                }, 3000);
            }
        } catch (error) {
            alert('Error al guardar: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
        }
    });
});
