import fs from 'fs-extra';

/**
 * @param {import('meow').Result} cli
 */
export const resetSession = async (cli) => {
	const sessionName = `${cli.input[0] ?? 'Session-debug'}`;

	if (await fs.exists(`./src/helper/connection/session/${sessionName}.json`)) {
		await fs.unlink(`./src/helper/connection/session/${sessionName}.json`);
	}

	if (await fs.exists(`./src/media/connection_databases/${sessionName}.json`)) {
		await fs.unlink(`./src/media/connection_databases/${sessionName}.json`);
	}
};

/**
 * @param {import('meow').Result} cli
 */
export const clearDBConnection = async (cli) => {
	if (!(await fs.exists(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`))) {
		await fs.writeFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`, JSON.stringify({}));
	}

	const data = await fs.readJSON(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);
	const session = await fs.readJSON(`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}.json`);

	session.keys = {};
	data.chats = [];
	data.contacts = {};
	data.messages = {};
	await fs.writeJSON(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`, data);
	await fs.writeJSON(`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}.json`, session);
};
