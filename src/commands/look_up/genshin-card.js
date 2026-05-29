import { DynamicTextAssets, EnkaClient, TextAssets } from 'enka-network-api';

import { GenshinCard } from '../../helper/canvas/card-render.js';
import { parseCharactersData, parseGenshinUser } from '../../helper/canvas/genshin-parser.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const enka = new EnkaClient({ showFetchCacheLog: false });

enka.cachedAssetsManager.cacheDirectoryPath = './cache';
enka.cachedAssetsManager.cacheDirectorySetup();

if (!(await enka.cachedAssetsManager.checkForUpdates(true))) {
	await enka.cachedAssetsManager.fetchAllContents();
}

enka.cachedAssetsManager.activateAutoCacheUpdater({
	instant: false,
	timeout: 60 * 60 * 1000,
	onUpdateStart: async () => {
		loggers.warning('Starting assets update for genshin database...'.yellow());
	},
	onUpdateEnd: async () => {
		enka.cachedAssetsManager.refreshAllData();
		loggers.info('Updating Completed!'.purple());
	}
});

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(uid) {
	const entry = cache.get(uid);

	if (!entry) {
		return null;
	}

	if (Date.now() - entry.timestamp > CACHE_TTL) {
		cache.delete(uid);
		return null;
	}

	return entry;
}

function setCache(uid, parsedUser, parsedCharacters) {
	cache.set(uid, { parsedUser, parsedCharacters, timestamp: Date.now() });
}

export default defineCommand({
	name: 'genshincard',
	minifiedDescription: 'Genshin Impact Build Card',
	description: 'Generate a Genshin Impact character build card from your showcase.',
	usage: '!genshincard `<uid>` [--char <name>] [--radar]',
	aliases: ['gicard', 'enkacard', 'buildcard'],
	category: 'Look-up',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, query, message, args, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a UID.\nUsage: !genshincard <uid> [--char <name>] [--radar]', message);
		}

		const uid = args[1];
		const useRadar = args.includes('--radar');

		if (!/^\d{9,10}$/.test(uid)) {
			return await client.reply(from, 'Invalid UID format. Must be 9-10 digits.', message);
		}

		const charFlag = args.indexOf('--char');
		const charName =
			charFlag !== -1
				? args
						.slice(charFlag + 1)
						.filter((a) => !a.startsWith('--'))
						.join(' ')
				: null;

		let parsedUser;
		let parsedCharacters;

		const cached = getCached(uid);

		if (cached) {
			parsedUser = cached.parsedUser;
			parsedCharacters = cached.parsedCharacters;
		} else {
			const wait = await client.waitMessage(from, 'Fetching character data...', message);

			let userInfo;

			try {
				userInfo = await enka.fetchUser(Number(uid));
			} catch {
				return await wait.update('Failed to fetch data. Make sure the UID is correct and your showcase is public.');
			}

			const jsonData = convertObjectToJson(userInfo);

			parsedUser = parseGenshinUser(jsonData);
			parsedCharacters = parseCharactersData(jsonData.characters);
			setCache(uid, parsedUser, parsedCharacters);
			await wait.update('Data fetched successfully.');
		}

		if (!parsedCharacters.length) {
			return await client.reply(from, 'No characters found in showcase.', message);
		}

		if (charName) {
			const found = parsedCharacters.find((c) => c.name.toLowerCase().includes(charName.toLowerCase()));

			if (!found) {
				const available = parsedCharacters.map((c) => c.name).join(', ');

				return await client.reply(from, `Character "${charName}" not found.\nAvailable: ${available}`, message);
			}

			const wait = await client.waitMessage(from, `Generating ${found.name}'s build card...`, message);

			const card = new GenshinCard(found, parsedUser, { statsChart: useRadar ? 'radar' : 'list' });
			const result = await card.render();
			const buffer = await result.toBuffer();

			await client.send(
				from,
				{ image: buffer, caption: `${found.name} | Lv.${found.level} | UID: ${uid}` },
				{ quoted: message }
			);

			return await wait.update(`Done. ${found.name}'s build card generated.`);
		}

		const ctx = { prefix };
		const builder = new client.TemplateBuilder.Native();

		const buttons = parsedCharacters.map((c) =>
			builder.button.reply({
				display: `${c.name} Lv.${c.level}`,
				id: cmdId('genshincard', `${uid} --char ${c.name}${useRadar ? ' --radar' : ''}`, ctx)
			})
		);

		await builder
			.destination(from)
			.body(
				`🎮 *Genshin Showcase* — UID: ${uid}\n\n${parsedUser.nickname || 'Unknown'} | AR ${parsedUser.level}\n\nSelect a character:`
			)
			.footer('Data cached for 10 minutes')
			.buttons(...buttons)
			.send({ quoted: message });
	}
});

function convertObjectToJson(obj) {
	if (typeof obj !== 'object' || obj === null || obj === undefined) {
		return obj;
	}

	const entries = Object.entries(obj)
		.filter(([key, value]) => !key.startsWith('_') && !(value instanceof EnkaClient))
		.map(([key, value]) => [key, convertObjectToJson(value)]);

	if (obj instanceof TextAssets) {
		entries.push(['text', obj instanceof DynamicTextAssets ? obj.getNullableReplacedText() : obj.getNullable()]);
	}

	return Object.fromEntries(entries);
}
