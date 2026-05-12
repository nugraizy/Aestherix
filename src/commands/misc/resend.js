import parser from 'yargs-parser';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'resend',
	description: 'Resend message.',
	usage: '!resend',
	aliases: ['revive'],
	category: 'Misc',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, query, mediaData, bodyQuoted }, client) => {
		const { quoted } = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				quoted: ['q']
			}
		});

		if (bodyQuoted && quoted) {
			return await client.relay(from, (await mediaData.extract().parse()).mediaData.message, {});
		}

		return await client.relay(from, mediaData.message, {});
	}
};
