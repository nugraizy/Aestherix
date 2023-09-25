import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isURL, parseCode } from '../../utils/modules/index.js';
import { getPost } from '../../utils/instagram/index.js';

const regex = (input) => /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s)\/([^/?#&]+)).*/.test(input);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'igreel',
	description: 'Downloads the reel of the user',
	usage: '!igreel <url>',
	aliases: ['igreel', 'igr'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, grouppMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a url');
		}

		const { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid url');
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid Instagram url');
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid url');

				continue;
			} else if (!regex(url.trim())) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid Instagram url');

				continue;
			}

			const parse = parseCode(url.trim());

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading Instagram reel', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if (parse) {
				const reel = await getPost(url);

				if ('error' in reel) {
					await client[botNum].reply(
						{ grouppMetadata, from, quoted: message },
						`Error while downloading Instagram reel\n\n${reel.error}\n${url}`
					);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download Instagram reel', 'red')} for ${color(prettyNumber, '#ff71ce')}`
					);

					continue;
				}

				let capt = 'Instagram reel'.formatHeaders();

				capt += `\n\nUsername : ${reel.user.username}\n`;
				capt += `Fullname : ${reel.user.fullName}\n`;

				if (reel.medias.length === 1) {
					await client[botNum].send(
						from,
						reel.medias[0].type === 'video'
							? { video: { url: reel.medias[0].url }, caption: capt.trim() }
							: {
									image: { url: reel.medias[0].url },
									caption: capt.trim()
							  } /* eslint-disable-line */,
						{ grouppMetadata, quoted: message }
					);
				}

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloaded Instagram reel', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
				);
				await delay(100);
			}
		}
	}
};
