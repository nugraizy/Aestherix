import { fetchBUFFER } from '../../utils/index.js';
import { Attachment } from '../../helper/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'attachment',
	description: 'Debugging Welcome/bye message',
	category: 'Debugging',
	usage: '!attachment',
	aliases: ['attach'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ sender, mention, from, groupName, groupMetadata }, client) {
		const attach = new Attachment(1024, 500);

		const { profile, radi } = await client[botNum]
			.profilePictureUrl(mention[0] || sender, 'image')
			.then(async (image) => ({ profile: new Buffer.from(await fetchBUFFER(image)), radi: 180 }))
			.catch(() => ({ profile: './src/media/blank.png', radi: 80 }));

		await attach.init(profile);

		attach.fillBackground();

		await attach.putAssets();
		await attach.appendImage({ roundedRadius: radi });
		await attach
			.appendText('Welcome to', '6289607055246', groupName, attach.canvas.width / 2, attach.canvas.height / 2, {
				fontSize: 62,
				color: attach.PALETTES.GREEN,
				shadow: true,
				participantColor: attach.PALETTES.GREEN,
				groupNameColor: attach.PALETTES.PURPLE,
				textColor: attach.PALETTES.RED
			})
			.placeCopyright();

		await client[botNum].send(from, { image: attach.toBuffer() }, { groupMetadata });
	}
};
