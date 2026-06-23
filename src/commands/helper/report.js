import { Limit } from '../../helper/index.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
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
		const Lh = useLocale(locale, 'helper');

		if (!query) {
			return await client.reply(from, L.errors.messageRequired, message);
		}

		if (args[1] === 'accept' && isOwner) {
			await client.reply(
				args[2],
				Lh.labels.reportAccepted,
				JSON.parse(args.slice(4))
			);

			Limit.addLimit(args[3], 20);

			return;
		}

		if (query.length < 20 && type !== 'templateButtonReplyMessage') {
			return await client.reply(from, L.errors.describeProblem, message);
		}

		const capt = Lh.labels.thanksReporting;

		await client.send(
			from,
			{
				text: capt.trim(),
				footer: Lh.labels.poweredBy,
				templateButtons: [],
				headerType: 1
			},
			{}
		);
		await client.send(toUserJid(settings.owner_number), {
			text: query,
			footer: `${Lh.labels.senderName} : ${pushname}
${Lh.labels.id} : ${sender}
${Lh.labels.idFormatter} : ${prettyNumber}
${Lh.labels.idApi} : wa.me/${sender.split('@')[0]}
${Lh.labels.problemOccured} : ${from}`,
			templateButtons: [
				{ urlButton: { displayText: Lh.labels.contactPerson, url: `https://wa.me/${sender.split('@')[0]}` } },
				{
					quickReplyButton: {
						displayText: Lh.labels.accept,
						id: cmdId('report', 'accept ' + from + ' ' + sender + ' ' + JSON.stringify(message), { prefix })
					}
				},
				{
					quickReplyButton: {
						displayText: Lh.labels.banned,
						id: cmdId('ban', 'report ' + from + ' ' + sender + ' ' + JSON.stringify(message), { prefix })
					}
				}
			],
			headerType: 1
		});
	}
});
