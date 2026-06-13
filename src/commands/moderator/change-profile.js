import { jidNormalizedUser } from 'baileys';
import yargsParser from 'yargs-parser';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'changeprofile',
	minifiedDescription: 'Profile Picture',
	description: 'Set the icon group or bot.',
	usage: '!changeprofile `<reply media/send media>`',
	aliases: ['setpp', 'seticon'],
	category: 'Moderation',
	cooldown: 0,
	limit: 2,
	status: 'enable',
	async run({ isOwner, isMediaImage, isMediaVid, from, message, mediaData, query }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isMediaImage) {
			return await client.reply(from, L.errors.imageMediaRequired, message);
		}

		if (isMediaVid) {
			return await client.reply(from, L.errors.imageMediaRequired, message);
		}

		const media = await client.downloadMediaMessage(mediaData);

		const options = yargsParser(query, {
			configuration: {
				'short-option-groups': false,
				'camel-case-expansion': false,
				'strip-aliased': true
			},
			alias: {
				self: ['s'],
				noCrop: ['nc'],
				noStretch: ['ns']
			}
		});

		(() => {
			const optionsString = Object.keys(options);

			const selfIndex = optionsString.findIndex((v) => v === 'self');
			const _ = optionsString.findIndex((v) => v === '_');

			if (selfIndex !== -1) {
				optionsString.splice(selfIndex, 1);
			}

			if (_ !== -1) {
				optionsString.splice(_, 1);
			}

			if (optionsString.length === 1) {
				return;
			}

			options[optionsString[1]] = false;

			return;
		})();

		if (options.self && !isOwner) {
			return await client.reply(from, L.errors.notOwner, message);
		}

		await client.updateProfilePicture(
			options.self ? jidNormalizedUser(client.user.id) : from,
			media,
			options.no_crop || options.noCrop ? 'no_crop' : options.no_stretch || options.noStretch ? 'no_stretch' : undefined
		);
	}
});
