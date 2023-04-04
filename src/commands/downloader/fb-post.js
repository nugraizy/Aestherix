import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, fetchBUFFER, INFOLOG, isURL, delay } from '../../utils/modules/index.js';
import { fbDl } from '../../utils/facebook/index.js';

const regex = (input) => /^(https?:\/\/)?((w{3}\.)|(m\.)?)?(facebook|fb)\.(com|watch)\/.*/.test(input);

export default {
	name: 'fbpost',
	description: 'Downloads a Facebook post',
	usage: '!fbpost <url>',
	aliases: ['fbpost', 'fbp', 'fb', 'fbdl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, grouppMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please provide a URL');
		}

		const { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid url');
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid Facebook url');
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid url');

				continue;
			} else if (!regex(url.trim())) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid Facebook url');

				continue;
			}

			const post = await fbDl(url.trim());

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading Facebook Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if ('error' in post) {
				await client[botNum].reply(
					{ grouppMetadata, from, quoted: message },
					`Failed while downloading Facebook post\n\n${post.error}\n${url}`
				);
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download Facebook Post', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);

				continue;
			}

			await client[botNum].send(
				from,
				post.isVideo
					? {
							video: new Buffer.from(await fetchBUFFER(post.url)),
							caption: `${'Facebook Video Downloader'.formatHeaders()}\n\n${
								post.datePosted ? `Post Uploaded : ${post.datePosted}\n` : ''
							}Res : ${post.resolution}${post.duration ? `\nDuration : ${post.duration}` : ''}`
					  } /* eslint-disable-line */
					: {
							image: new Buffer.from(await fetchBUFFER(post.url)),
							caption: `${'Facebook Image Downloader'.formatHeaders()}\n\n${
								post.datePosted ? `Post Uploaded : ${post.datePosted}\n` : ''
							}Res : ${post.resolution}`
					  } /* eslint-disable-line */,
				{ grouppMetadata }
			);
			await delay(300);
		}

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Downloaded Facebook Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
		);
	}
};
