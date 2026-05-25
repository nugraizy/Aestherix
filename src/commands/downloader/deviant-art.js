import parser from 'yargs-parser';

import { downloadDeviantArt } from '../../utils/deviant-art/index.js';
import { color, loggers, numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.)?deviantart\.com\/[0-9a-bA-Z-?]*\/art\/[0-9a-zA-Z-?]*[0-9]*/gi;
	const isDeviant = reg.test(input);

	if (isDeviant) {
		const match = input.match(/\d{8,10}/g);

		if (!match) {
			return { status: false, message: 'DeviantArt code not found on your URL. Try another URL.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Deviant Art URL. Try another URL.' };
};

export default defineCommand({
	name: 'deviantartdl',
	minifiedDescription: 'Download Deviant Art',
	description: 'Download images from Deviant Art',
	usage: '!deviantartdl `<url(s)>` (you can send multiple link using space in between)',
	category: 'Downloader',
	aliases: ['dvartdl', 'devartdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, prettyNumber }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		const wait = await client.waitMessage(from, 'Please wait...', message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Deviantart File', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			const regexs = regex(url.trim());

			if (!regexs.status) {
				await client.reply(from, regexs.message + `\nInvalid : ${url}`, message);
				error++;
				continue;
			}

			const result = await downloadDeviantArt(url);

			if (result?.error) {
				await client.reply(from, result.error, message);
				loggers.error(`${color('Failed to Download Deviantart File', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			await client.send(
				from,
				{
					image: { url: result.image },
					caption:
						'Deviant Art'.formatHeaders() +
						`\n\nTitle : ${result.author.capitalize()}
Author : ${result.author}
Favourites : ${numberWithCommas(result.favourites)}
Views : ${numberWithCommas(result.views)}`.formatForm(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result.image } },
						{ urlButton: { displayText: 'Deviant Art Source', url: result.source } }
					],
					footer: ''
				},
				{ quoted: message }
			);

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Deviantart File', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
