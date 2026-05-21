document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const btn = document.getElementById('signInBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value; // En el MVP usamos el username aquí
            const password = document.getElementById('password').value;

            // Animación de carga
            const originalContent = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Autenticando...
            `;

            try {
                // En el MVP el email lo tomamos como username para simplificar según el plan
                const username = email.split('@')[0]; 
                
                const response = await apiFetch('/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });

                if (response.status === 'success') {
                    localStorage.setItem('coach', JSON.stringify(response.user));
                    btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Éxito`;
                    btn.classList.replace('bg-primary-container', 'bg-emerald-600');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 800);
                }
            } catch (error) {
                alert('Error: ' + error.message);
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        });
    }
});
