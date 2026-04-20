import _ from 'lodash';

import configuration from '../../helper/config/connect.js';

const getDisplayUrl = (value) => {
	if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
		return value.trim();
	}

	if (value && typeof value === 'object') {
		const originalUrl = String(value?.original?.url || '').trim();

		if (/^https?:\/\//i.test(originalUrl)) {
			return originalUrl;
		}

		const legacyUrl = String(value?.url || '').trim();

		if (/^https?:\/\//i.test(legacyUrl)) {
			return legacyUrl;
		}
	}

	return '';
};

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

		const builder = new client.instance.TemplateBuilder.Carousel();

		const entries = _.chunk(pictures.entries(), 30);

		const parsedEntries = entries
			.map((group) =>
				group
					.map(([stamp, value]) => {
					const [date, time] = stamp.split(/[ + ]+/);
					const url = getDisplayUrl(value);

					if (!url) {
						return null;
					}

					return {
						timestamp: `${date} ${time}`,
						url
					};
				})
				.filter(Boolean)
			)
			.filter((group) => group.length > 0)
			.reverse();

		await builder
			.destination(from)
			.body(caption)
			.footer('Powered by Hidden Finder')
			.header('Header')
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
			)
			.send();
	}
};
