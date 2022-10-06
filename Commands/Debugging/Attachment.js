/* global botNum */
import { Attachment } from '../../Helper/index.js';

export default {
	name: 'attachment',
	description: 'Debugging Welcome/bye message',
	category: 'Debugging',
	usage: '!attachment',
	aliases: ['attach'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
	async run({ sender, mention, from, groupName }, client) {
		const attach = new Attachment(1024, 500);

		const profile = await client[botNum].profilePictureUrl(mention[0] || sender, 'image').catch(() => './Media Files/blank.png');

		(await attach.fillBackground().appendImage(profile, { stroke: true, strokeWidth: 9, strokeColor: attach.PALETTES.RED, roundedRadius: 70 })).appendText(
			'Welcome to',
			mention?.[0]?.split('@')?.[0] || sender.split('@')[0],
			groupName,
			attach.canvas.width / 2,
			attach.canvas.height / 2,
			{
				fontSize: 62,
				color: attach.PALETTES.GREEN,
				shadow: true,
				participantColor: attach.PALETTES.GREEN,
				groupNameColor: attach.PALETTES.PURPLE,
				textColor: attach.PALETTES.RED,
			},
		);

		await client[botNum].sendMessage(from, { image: new Buffer.from(attach.toBuffer(), 'base64') });
	},
};
