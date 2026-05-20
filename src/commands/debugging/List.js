import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'list',
	description: 'Send list message.',
	category: 'Debugging',
	usage: '!list',
	aliases: ['lst'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
	async run({ from, query }, client) {
		const row = Array(Number(query || 1)).fill({
			rows: [
				{
					title: 'Powered by Hidden Finder',
					rowId: 'Powered by Hidden Finder'
				}
			],
			title: 'Powered by Hidden Finder'
		});

		await client.send(from, {
			buttonText: 'Powered by Hidden Finder',
			title: 'List Message',
			text: '\t',
			footer: 'Powered by Hidden Finder',
			sections: row
		});
	}
});
