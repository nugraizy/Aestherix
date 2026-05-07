import prisma from '../../database/prisma.js';

const fixFileName = (fileName) => fileName.replace(/\//g, '__').replace(/:/g, '-');

const getSessionIdPrefix = (sessionName) => {
	const name = String(sessionName || '').trim();

	if (!name) {
		return '';
	}

	return fixFileName(`${name}:`);
};

/**
 * @param {import('meow').Result} cli
 */
export const resetSession = async (cli) => {
	const sessionName = `${cli.input[0] ?? 'Session-debug'}`;
	const sessionPrefix = getSessionIdPrefix(sessionName);

	await prisma.session.deleteMany({
		where: { sessionId: { startsWith: sessionPrefix } }
	});
};

/**
 * @param {import('meow').Result} cli
 */
export const clearDBConnection = async (cli) => {
	if (!cli.flags.resetOnStart) {
		return;
	}

	const sessionName = `${cli.input[0] ?? 'Session-debug'}`;
	const sessionPrefix = getSessionIdPrefix(sessionName);

	await prisma.session.deleteMany({
		where: { sessionId: { startsWith: sessionPrefix } }
	});
};
