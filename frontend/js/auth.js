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
                const username = document.getElementById('email').value; 
                
                const response = await apiFetch('/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });

                if (response.status === 'success') {
                    localStorage.setItem('role', response.role);
                    if (response.role === 'coach') {
                        localStorage.setItem('coach', JSON.stringify(response.user));
                        btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Éxito`;
                        btn.classList.replace('bg-primary-container', 'bg-emerald-600');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 800);
                    } else if (response.role === 'athlete') {
                        localStorage.setItem('athlete', JSON.stringify(response.user));
                        btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Éxito`;
                        btn.classList.replace('bg-primary-container', 'bg-emerald-600');
                        setTimeout(() => {
                            window.location.href = 'athlete-dashboard.html';
                        }, 800);
                    }
                }
            } catch (error) {
                showToast('Error: ' + error.message, true);
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        });
    }

    // Toast feedback function
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const msg = document.getElementById('toast-msg');
        
        if (!toast || !icon || !msg) return;
        
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
});
