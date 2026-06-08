import prisma from '../helper/database/prisma.js';

const sanitize = (name) => (name ? name.replace(/\//g, '__').replace(/:/g, '-') : '');

export async function cleanupSession(sessionName, db = prisma) {
	const name = sanitize(sessionName);

	if (!name) {
		return;
	}

	const prefix = `${name}-`;

	await Promise.all([
		db.session.deleteMany({ where: { sessionId: { startsWith: prefix } } }),
		db.baileysStore.deleteMany({ where: { sessionName } }),
		db.botInstance.deleteMany({ where: { sessionName } })
	]);
}
