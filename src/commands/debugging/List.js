export default {
	name: 'list',
	description: 'Send list message.',
	category: 'Debugging',
	usage: '!list',
	aliases: ['lst'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, query }, client) {
		const row = Array(Number(query || 1)).fill({
			rows: [
				{
					title: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					rowId: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪'
				}
			],
			title: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪'
		});

		await client[botNum].send(from, {
			buttonText: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
			title: 'List Message',
			text: '\t',
			footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
			sections: row
		});
	}
};
