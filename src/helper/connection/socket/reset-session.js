import prisma from '../../database/prisma.js';
import { resolveSessionName } from '../utils/session-name.js';

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
	if (!cli.flags.resetOnStart) {
		return;
	}

	const sessionName = await resolveSessionName(cli?.input?.[0]);
	const sessionPrefix = getSessionIdPrefix(sessionName);

	await prisma.session.deleteMany({
		where: { sessionId: { startsWith: sessionPrefix } }
	});
};
