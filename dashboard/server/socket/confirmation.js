import crypto from 'crypto';

import configuration from '../../../src/helper/config/connect.js';
import prisma from '../../../src/helper/database/prisma.js';

export function createConfirmationBridge({ auth }) {
	if (!auth) {
		throw new Error('confirmation: auth service is required');
	}

	return {
		processConfirmationAction(payload) {
			return auth.processConfirmationAction(payload);
		},
		bind(loginNamespace) {
			loginNamespace.on('connection', (socket) => {
				let pollTimer = null;
				let lastStatus = null;

				const stopPolling = () => {
					if (pollTimer) {
						clearInterval(pollTimer);
						pollTimer = null;
					}
				};

				const emit = async () => {
					if (!socket.data?.confirmation) {
						return;
					}

					const result = await auth.getConfirmationStatus(socket.data.confirmation);

					if (!result.ok) {
						socket.emit('dashboard:confirmation:error', {
							message: result.message || 'Confirmation failed.',
							status: result.status || 400
						});
						stopPolling();
						return;
					}

					if (result.status === lastStatus) {
						return;
					}

					lastStatus = result.status;
					socket.emit('dashboard:confirmation:status', { status: result.status });

					if (result.status === 'approved' || result.status === 'rejected') {
						stopPolling();
					}
				};

				socket.on('dashboard:confirmation:start', (payload) => {
					stopPolling();
					lastStatus = null;

					const phoneNumber = auth.normalizePhoneNumber(payload?.phoneNumber || '');
					const requestId = String(payload?.requestId || '').trim();
					const requestKey = String(payload?.requestKey || '').trim();

					if (!phoneNumber || !requestId || !requestKey) {
						socket.emit('dashboard:confirmation:error', { message: 'Invalid confirmation payload.' });
						return;
					}

					socket.data.confirmation = { phoneNumber, requestId, requestKey };

					void emit();

					pollTimer = setInterval(() => {
						void emit();
					}, 1500);
				});

				socket.on('dashboard:confirmation:stop', () => {
					socket.data.confirmation = null;
					stopPolling();
				});

				socket.on('disconnect', () => {
					stopPolling();
				});
			});
		}
	};
}

function normalizePhoneNumberForOtp(input) {
	let digits = String(input || '').replace(/\D/g, '');

	if (digits.startsWith('0')) {
		digits = `62${digits.slice(1)}`;
	}

	return digits;
}

function hashOtpValue(value) {
	return crypto.createHash('sha256').update(String(value)).digest('hex');
}

async function processConfirmationActionDirect(payload) {
	const id = String(payload?.actionId || '').trim();

	if (!id.startsWith('dashauth:confirm:') && !id.startsWith('dashauth:reject:')) {
		return { handled: false };
	}

	const parts = id.split(':');

	if (parts.length !== 4) {
		return { handled: true, approved: false, message: 'Malformed confirmation button payload.' };
	}

	const [, action, requestId, token] = parts;
	const phoneNumber = normalizePhoneNumberForOtp(String(payload?.senderJid || '').split('@')[0]);

	if (!phoneNumber) {
		return { handled: true, approved: false, message: 'Confirmation request not found.' };
	}

	let row;

	try {
		row = await prisma.dashboardOtp.findUnique({ where: { phoneNumber } });
	} catch {
		return { handled: true, approved: false, message: 'Failed to read confirmation state.' };
	}

	const expiresAt = row?.expiresAt !== null && row?.expiresAt !== undefined ? Number(row.expiresAt) : 0;

	if (!row || expiresAt <= Date.now()) {
		if (row) {
			await prisma.dashboardOtp.deleteMany({ where: { phoneNumber } }).catch(() => {});
		}

		return { handled: true, approved: false, message: 'Confirmation request expired.' };
	}

	if (row.requestId !== requestId) {
		return { handled: true, approved: false, message: 'Confirmation request mismatch.' };
	}

	if (row.actionTokenHash !== hashOtpValue(token)) {
		return { handled: true, approved: false, message: 'Invalid confirmation token.' };
	}

	const now = new Date();

	if (action === 'reject') {
		await prisma.dashboardOtp
			.update({
				where: { phoneNumber },
				data: { status: 'rejected', confirmedAt: now }
			})
			.catch(() => {});

		return { handled: true, approved: false, message: 'Dashboard login request rejected.' };
	}

	if (action !== 'confirm') {
		return { handled: true, approved: false, message: 'Unknown confirmation action.' };
	}

	await prisma.dashboardOtp
		.update({
			where: { phoneNumber },
			data: { status: 'approved', confirmedAt: now }
		})
		.catch(() => {});

	return { handled: true, approved: true, phoneNumber };
}

export async function processDashboardConfirmationAction(payload) {
	const handler = configuration?.dashboard?.processConfirmationAction;

	if (typeof handler === 'function') {
		return handler(payload);
	}

	return processConfirmationActionDirect(payload);
}
