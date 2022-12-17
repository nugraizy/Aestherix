/* global botNum */
import { addUserLimit } from '../../helper/index.js';

export default {
	name: 'report',
	description: 'Report bug or error to the owner',
	usage: '!report',
	aliases: ['lapor'],
	category: 'Helper',
	cooldown: 40,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, sender, pushname, prettyNumber, settings, type, isOwner, args }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a message to report');
		}

		if (args[1] == 'accept' && isOwner) {
			await client[botNum].reply(
				{ from: args[2], quoted: JSON.parse(args.slice(4)) },
				'Your problem has been accepted by the Owner. Please wait for the fix. And for the bonuses you will be given 20 Limit.',
			);

			addUserLimit(args[3], 20);

			return;
		}

		if (query.length < 20 && type !== 'templateButtonReplyMessage') {
			return await client[botNum].reply(
				{ from, quoted: message },
				'Please describe the problem in detail. Min. 20 characters',
			);
		}

		const capt =
			'Thanks for reporting!\n\nThis error will be reviewed and fixed as soon as possible.\n\nIf you have any questions, please contact the owner.';

		await client[botNum].sendMessage(from, {
			text: capt.trim(),
			footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
			templateButtons: [],
			headerType: 1,
		});
		await client[botNum].sendMessage(settings.owner_number, {
			text: query,
			footer: `Sender Name : ${pushname}
ID : ${sender}
ID Formatter : ${prettyNumber}
ID API : wa.me/${sender.split('@')[0]}
The Problem Occured in : ${from}`,
			templateButtons: [
				{ urlButton: { displayText: 'Contact Person', url: `https://wa.me/${sender.split('@')[0]}` } },
				{ quickReplyButton: { displayText: 'Accept', id: `.report accept ${from} ${sender} ${JSON.stringify(message)}` } },
				{ quickReplyButton: { displayText: 'Banned', id: `.ban report ${from} ${sender} ${JSON.stringify(message)}` } },
			],
			headerType: 1,
		});
	},
};
