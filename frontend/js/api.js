const API_URL = 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const response = await fetch(`${API_URL}${endpoint}`, { ...defaultOptions, ...options });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error en la petición');
    }
    return response.json();
}
