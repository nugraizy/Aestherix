const BASE = '/api/dashboard';

async function request(path, options = {}) {
	const response = await fetch(`${BASE}${path}`, {
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...options.headers },
		...options
	});

	if (!response.ok) {
		let message = `${response.status} ${response.statusText}`;
		let retryAfter = null;

		try {
			const body = await response.json();

			if (body?.message) {
				message = body.message;
			}

			if (body?.retryAfter) {
				retryAfter = body.retryAfter;
			}
		} catch {
			// Response body is not JSON; fall through with the default status message.
		}

		const error = new Error(message);

		error.retryAfter = retryAfter;

		throw error;
	}

	return response.json();
}

export function get(path) {
	return request(path);
}

export function post(path, body) {
	return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function patch(path, body) {
	return request(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function logout() {
	await fetch('/api/dashboard/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function restartBot() {
	return post('/bot/restart');
}

export async function startBot() {
	return post('/bot/start');
}

export async function stopBot() {
	return post('/bot/stop');
}

export function setUserLimit(userId, limit) {
	return post(`/users/${encodeURIComponent(userId)}/limit`, { limit });
}

export function setUserPremium(userId, enabled) {
	return post(`/users/${encodeURIComponent(userId)}/premium`, { enabled });
}

export function setUserBanned(userId, enabled) {
	return post(`/users/${encodeURIComponent(userId)}/banned`, { enabled });
}

export function setUserBlocked(userId, enabled) {
	return post(`/users/${encodeURIComponent(userId)}/blocked`, { enabled });
}

export function getSettings() {
	return get('/settings');
}

export function updateSettings(patchBody) {
	return patch('/settings', patchBody);
}

export function exportSettings() {
	return window.open('/api/dashboard/settings/export', '_blank');
}

export function importSettings(data) {
	return post('/settings/import', data);
}

export function getSessions() {
	return get('/auth/sessions');
}

export function revokeSession(id) {
	return post(`/auth/sessions/${encodeURIComponent(id)}/revoke`);
}

export function getGroups() {
	return get('/groups');
}

export function getGroupSettings(groupId) {
	return get(`/groups/${encodeURIComponent(groupId)}/settings`);
}

export function updateGroupSetting(groupId, field, value) {
	return patch(`/groups/${encodeURIComponent(groupId)}/settings`, { field, value });
}

export function getGroupInfo(groupId) {
	return get(`/groups/${encodeURIComponent(groupId)}/info`);
}

export function groupParticipantAction(groupId, action, participants) {
	return post(`/groups/${encodeURIComponent(groupId)}/participants`, { action, participants });
}

export function getSystemHealth() {
	return get('/system/health');
}

export function getSystemCache() {
	return get('/system/cache');
}

export function getSystemEnv() {
	return get('/system/env');
}

export function getCommandAnalytics() {
	return get('/commands/analytics');
}

export function clearSystemCache(name) {
	return post(`/system/cache/${encodeURIComponent(name)}/clear`);
}

export function purgeAuditLog() {
	return post('/system/audit/purge');
}

export function sendBroadcast(body) {
	return post('/broadcast', body);
}

export function getBroadcastStatus() {
	return get('/broadcast/status');
}

export function getBroadcastContacts() {
	return get('/broadcast/contacts');
}

export function getBroadcastTemplates() {
	return get('/broadcast/templates');
}

export function saveBroadcastTemplate(template) {
	return post('/broadcast/templates', template);
}

export function deleteBroadcastTemplate(name) {
	return request(`/broadcast/templates/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function scheduleBroadcast(body) {
	return post('/broadcast/schedule', body);
}

export function cancelScheduledBroadcast(id) {
	return post(`/broadcast/schedule/${encodeURIComponent(id)}/cancel`);
}

export function getScheduledBroadcast() {
	return get('/broadcast/schedule');
}

export function quickSend(jid, message) {
	return post('/quick-send', { jid, message });
}

export function getMessageLogs({ q, jid, limit } = {}) {
	const params = new URLSearchParams();

	if (q) {
		params.set('q', q);
	}

	if (jid) {
		params.set('jid', jid);
	}

	if (limit) {
		params.set('limit', String(limit));
	}

	const qs = params.toString();

	return get(`/messages${qs ? `?${qs}` : ''}`);
}

export function getSubBots() {
	return get('/subbots');
}

export function startSubBot(name) {
	return post(`/subbots/${encodeURIComponent(name)}/start`);
}

export function stopSubBot(name) {
	return post(`/subbots/${encodeURIComponent(name)}/stop`);
}

export function updateSubBotFlags(name, flags) {
	return request(`/subbots/${encodeURIComponent(name)}/flags`, {
		method: 'PATCH',
		body: JSON.stringify({ flags })
	});
}

export function removeSubBot(name, purge = false) {
	const qs = purge ? '?purge=1' : '';

	return request(`/subbots/${encodeURIComponent(name)}${qs}`, { method: 'DELETE' });
}

export function getSubBotLogs(name, { since = 0, limit = 200 } = {}) {
	const qs = new URLSearchParams({ since: String(since), limit: String(limit) }).toString();

	return request(`/logs/subbot/${encodeURIComponent(name)}?${qs}`);
}
