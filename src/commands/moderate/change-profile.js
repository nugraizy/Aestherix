import yargsParser from 'yargs-parser';
import { jidNormalizedUser } from 'baileys';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!isMediaImage) {
			return await client.instance.reply('Please send/reply a media[image]', { from, quoted: message });
		}

		if (isMediaVid) {
			return await client.instance.reply('Please send/reply a media[image]', { from, quoted: message });
		}

		const media = await client.instance.downloadMediaMessage(mediaData);

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
			return await client.instance.reply('You are not owner. This commands is only for owner.', {
				from,
				quoted: message
			});
		}

		await client.instance.updateProfilePicture(
			options.self ? jidNormalizedUser(instance) : from,
			media,
			options.no_crop || options.noCrop ? 'no_crop' : options.no_stretch || options.noStretch ? 'no_stretch' : undefined
		);
	}
};
