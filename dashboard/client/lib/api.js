const BASE = '/api/dashboard';

async function request(path, options = {}) {
	const response = await fetch(`${BASE}${path}`, {
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...options.headers },
		...options
	});

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	return response.json();
}

export function get(path) {
	return request(path);
}

export function post(path, body) {
	return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function logout() {
	await fetch('/api/dashboard/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function restartBot() {
	return post('/bot/restart');
}
