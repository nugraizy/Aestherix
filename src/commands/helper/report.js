import { Limit } from '../../helper/index.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { toUserJid } from '../../helper/misc/wa_data/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'report',
	minifiedDescription: 'Report Bug/Error',
	description: 'Report bug or error to the owner.',
	usage: '!report',
	aliases: ['lapor'],
	category: 'Helper',
	cooldown: 40,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, sender, pushname, prettyNumber, settings, type, isOwner, args, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.messageRequired, message);
		}

		if (args[1] === 'accept' && isOwner) {
			await client.reply(
				args[2],
				'Your problem has been accepted by the Owner. Please wait for the fix. And for the bonuses you will be given 20 Limit.',
				JSON.parse(args.slice(4))
			);

			Limit.addLimit(args[3], 20);

			return;
		}

		if (query.length < 20 && type !== 'templateButtonReplyMessage') {
			return await client.reply(from, L.errors.describeProblem, message);
		}

		const capt =
			'Thanks for reporting!\n\nThis error will be reviewed and fixed as soon as possible.\n\nIf you have any questions, please contact the owner.';

		await client.send(
			from,
			{
				text: capt.trim(),
				footer: 'Powered by Hidden Finder',
				templateButtons: [],
				headerType: 1
			},
			{}
		);
		await client.send(toUserJid(settings.owner_number), {
			text: query,
			footer: `Sender Name : ${pushname}
ID : ${sender}
ID Formatter : ${prettyNumber}
ID API : wa.me/${sender.split('@')[0]}
The Problem Occured in : ${from}`,
			templateButtons: [
				{ urlButton: { displayText: 'Contact Person', url: `https://wa.me/${sender.split('@')[0]}` } },
				{
					quickReplyButton: {
						displayText: 'Accept',
						id: cmdId('report', 'accept ' + from + ' ' + sender + ' ' + JSON.stringify(message), { prefix })
					}
				},
				{
					quickReplyButton: {
						displayText: 'Banned',
						id: cmdId('ban', 'report ' + from + ' ' + sender + ' ' + JSON.stringify(message), { prefix })
					}
				}
			],
			headerType: 1
		});
	}
});
