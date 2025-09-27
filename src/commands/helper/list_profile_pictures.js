import _ from 'lodash';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'listpp',
	minifiedDescription: 'List Profile Pictures',
	description: 'List every pictures of the profile, started from the project startup.',
	usage: '!listpp',
	aliases: ['lspp'],
	category: 'Helper',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	async run({ from, message }, client) {
		const pictures = configuration.pinterestImages;

		if (!pictures.size) {
			return client.instance.send(from, { text: 'No profile pictures have been saved yet.' }, { quoted: message });
		}

		let caption = `📌 Total saved sequences: ${pictures.size}\n\n`;

		const builder = new client.instance.TemplateBuilder.Carousel(client);

		const entries = _.chunk(pictures.entries(), 30);

		const parsedEntries = entries
			.map((group) =>
				group.map(([stamp, url]) => {
					const [date, time] = stamp.split(/[ + ]+/);

					return {
						timestamp: `${date} ${time}`,
						url
					};
				})
			)
			.reverse();

		builder
			.mainBody(caption)
			.mainFooter('Powered by Aestherix')
			.mainHeader('Header')
			.cards(
				parsedEntries
					.map((data) => ({
						body: `Sequence from ${data[0].timestamp.split(' ')[1]} to ${data[data.length - 1].timestamp.split(' ')[1]}`,
						footer: `Total Pictures: ${data.length}`,
						title: '',
						header: data[0].url,
						buttons: data.map((v) => builder.button.url({ display: v.timestamp, url: v.url }))
					}))
					.slice(0, 30)
			);

		const messageBuilt = await builder.render();

		await client.instance.relayMessage(from, messageBuilt.message, { messageId: messageBuilt.key.id });
	}
};
