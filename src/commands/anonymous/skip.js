import { skip } from '../../utils/anonymous/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'skip',
	minifiedDescription: 'Anonymous Skip',
	description: 'Skip a partner',
	category: 'Anonymous',
	usage: '!skip',
	aliases: ['skippartner'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message }, client) {
		const result = skip(from, 20, client, message);

		if (!result) {
			return await client.reply(from, 'You are not in a search!', message);
		}

		if (result.partner2) {
			await client.reply(from, 'You have skipped your partner!', message);
			await client.send(result.partner2, { text: 'Your partner skipped the chat!' }, {});
			return;
		}

		await client.reply(from, `You are already searching for a partner!\nPlease wait for ${result.seconds}s`, message);
	}
});
