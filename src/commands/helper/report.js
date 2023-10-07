import { addUserLimit } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'report',
	description: 'Report bug or error to the owner',
	usage: '!report',
	aliases: ['lapor'],
	category: 'Helper',
	cooldown: 40,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, sender, pushname, prettyNumber, settings, type, isOwner, args, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide a message to report', { from, quoted: message, groupMetadata });
		}

		if (args[1] === 'accept' && isOwner) {
			await client[botNum].reply(
				'Your problem has been accepted by the Owner. Please wait for the fix. And for the bonuses you will be given 20 Limit.',
				{ from: args[2], quoted: JSON.parse(args.slice(4)), groupMetadata }
			);

			addUserLimit(args[3], 20);

			return;
		}

		if (query.length < 20 && type !== 'templateButtonReplyMessage') {
			return await client[botNum].reply('Please describe the problem in detail. Min. 20 characters', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const capt =
			'Thanks for reporting!\n\nThis error will be reviewed and fixed as soon as possible.\n\nIf you have any questions, please contact the owner.';

		await client[botNum].send(
			from,
			{
				text: capt.trim(),
				footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				templateButtons: [],
				headerType: 1
			},
			{ groupMetadata }
		);
		await client[botNum].send(settings.owner_number, {
			text: query,
			footer: `Sender Name : ${pushname}
ID : ${sender}
ID Formatter : ${prettyNumber}
ID API : wa.me/${sender.split('@')[0]}
The Problem Occured in : ${from}`,
			templateButtons: [
				{ urlButton: { displayText: 'Contact Person', url: `https://wa.me/${sender.split('@')[0]}` } },
				{ quickReplyButton: { displayText: 'Accept', id: `.report accept ${from} ${sender} ${JSON.stringify(message)}` } },
				{ quickReplyButton: { displayText: 'Banned', id: `.ban report ${from} ${sender} ${JSON.stringify(message)}` } }
			],
			headerType: 1
		});
	}
};
