import { Attachment } from '../../helper/index.js';
import { fetchBUFFER } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'attachment',
	minifiedDescription: 'Welcome/Bye Image',
	description: 'Debugging Welcome/bye message',
	category: 'Debugging',
	usage: '!attachment',
	aliases: ['attach'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ sender, mention, from, groupName }, client) {
		const attach = new Attachment(1024, 500);

		const { profile, radi } = await client
			.profilePictureUrl(mention[0] || sender, 'image')
			.then(async (image) => ({ profile: await fetchBUFFER(image), radi: 180 }))
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

		await client.send(from, { image: attach.toBuffer() }, {});
	}
};
