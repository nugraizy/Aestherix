import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'test-timeout',
	description: 'Test the command timeout feature',
	usage: '!test-timeout [seconds]',
	category: 'Debugging',
	cooldown: 5,
	limit: 0,
	timeout: 5000,
	status: 'enable',
	async run({ from, query }, client) {
		const seconds = Number(query) || 10;

		await client.reply(from, `Sleeping for ${seconds}s (timeout is 5s)...`);

		await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

		await client.reply(from, `Done after ${seconds}s`);
	}
});
