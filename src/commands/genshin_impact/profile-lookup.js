import parser from 'yargs-parser';

import { color, loggers } from '../../utils/modules/index.js';
import { genshinProfile, getCharacters } from '../../utils/games/index.js';

const regex = async (input) => {
	const match = input.match(/^\d{9,10}/g);

	if (!match) {
		return { status: false, message: 'That is not a valid UID' };
	}

	if (!(await genshinProfile(match[0]))) {
		return { status: false, message: 'We can not find your char' };
	}

	return { status: true, message: match[0] };
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'genshinstalk',
	minifiedDescription: 'Look-up Genshin Impact Player',
	description: 'Look-up Genshin Impact player.',
	usage: '!genshinstalk <uids>',
	aliases: ['genshinuser', 'giuser', 'gistalk'],
	category: 'Genshin Impact',
	cooldown: 6,
	limit: 4,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply('Please specify an UID', { from, quoted: message });
		}

		let {
			_: uids,
			character,
			statistic,
			description
		} = parser(query, {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				character: ['char'],
				statistic: ['uid', 'stats'],
				description: ['desc', 'descriptions', 'desk']
			}
		});

		for (const uid of uids) {
			const reg = await regex(String(uid));

			if (!reg.status) {
				return await client.instance.reply(reg.message, { from, quoted: message });
			}

			let info;

			if (statistic) {
				info = await genshinProfile(String(uid));
			} else if (character) {
				info = await getCharacters(String(uid));
			} else {
				info = await genshinProfile(String(uid));
			}

			if (info?.error) {
				await client.instance.reply(`Error while searching Genshin Impact player\n\n${info.error}`, {
					from,
					quoted: message
				});

				loggers.error(
					`⚠️ ${color('Failed to Searching Genshin Impact player', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`
				);

				continue;
			} else {
				let capt;

				if (statistic) {
					capt = `${'Genshin Impact Statistic'.formatHeaders()}

${'Proflie'.formatHeaders()}\n
Nickname: ${info.role.nickname}
Server: ${info.role.region.replace('os_', '')}
Level: ${info.role.level}\n\n
${'Stats'.formatHeaders()}\n
Achievement: ${info.stats.achievement_number}
Way Point: ${info.stats.way_point_number}
Avatar: ${info.stats.avatar_number}
Domain: ${info.stats.domain_number}
Spiral Abyss: ${info.stats.spiral_abyss}
Domain: ${info.stats.domain_number}
Anemoculus: ${info.stats.anemoculus_number}
Geoculus: ${info.stats.geoculus_number}
Electroculus: ${info.stats.electroculus_number}\n\n
${'Chest'.formatHeaders()}\n
Common: ${info.stats.common_chest_number}
Exquisite: ${info.stats.exquisite_chest_number}
Luxurios: ${info.stats.luxurious_chest_number}
Precious: ${info.stats.precious_chest_number}
Magic: ${info.stats.magic_chest_number}`;
				} else if (character) {
					capt = `${'Genshin Impact Characters'.formatHeaders()}

• Total: ${info.length}\n\n`;

					for (const {
						name,
						weapon: {
							name: weaponName,
							rarity: weaponRarity,
							level: weaponLevel,
							affix_level: affixLevel,
							type_name: typeName,
							desc
						},
						rarity,
						level,
						actived_constellation_num: activedConstellationNum
					} of info) {
						capt += `• ${name} | ⭐${rarity} | ${level} | C${activedConstellationNum}
• ${weaponName} | ${typeName} | ⭐${weaponRarity} | ${weaponLevel} | R${affixLevel}${description ? '\n' : ''}${
							description ? `• ${desc}\n` : ''
						}
──────────────────────\n\n`;
					}
				} else {
					capt = `${'Genshin Impact Statistic'.formatHeaders()}

${'Proflie'.formatHeaders()}\n
Nickname: ${info.role.nickname}
Server: ${info.role.region.replace('os_', '')}
Level: ${info.role.level}\n\n
${'Stats'.formatHeaders()}\n
Achievement: ${info.stats.achievement_number}
Way Point: ${info.stats.way_point_number}
Avatar: ${info.stats.avatar_number}
Domain: ${info.stats.domain_number}
Spiral Abyss: ${info.stats.spiral_abyss}
Domain: ${info.stats.domain_number}
Anemoculus: ${info.stats.anemoculus_number}
Geoculus: ${info.stats.geoculus_number}
Electroculus: ${info.stats.electroculus_number}\n\n
${'Chest'.formatHeaders()}\n
Common: ${info.stats.common_chest_number}
Exquisite: ${info.stats.exquisite_chest_number}
Luxurios: ${info.stats.luxurious_chest_number}
Precious: ${info.stats.precious_chest_number}
Magic: ${info.stats.magic_chest_number}`;
				}

				await client.instance.reply(capt.trim().formatForm(), { from, quoted: message });
			}
		}
	}
};
