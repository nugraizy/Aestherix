import { fetch } from 'undici';

const _api = (type, input) => `https://api.waifu.pics/many/${type}/${input}`;

/**
 * @typedef {'nsfw' | 'sfw'} WaifuTypes
 * @typedef {'waifu' | 'neko' | 'trap' | 'blowjob'} NSFWTypes
 * @typedef {'waifu' | 'neko' | 'shinobu' | 'megumin' | 'bully' | 'cuddle' | 'cry' | 'hug' | 'awoo' | 'kiss' | 'lick' | 'pat' | 'smug' | 'bonk' | 'yeet' | 'blush' | 'smile' | 'wave' | 'highfive' | 'handhold' | 'nom' | 'bite' | 'glomp' | 'slap' | 'kill' | 'kick' | 'happy' | 'wink' | 'poke' | 'dance' | 'cringe'} SFWTypes
 */
const _type = {
	nsfw: 'waifu,neko,trap,blowjob'.split(','),
	sfw: 'waifu,neko,shinobu,megumin,bully,cuddle,cry,hug,awoo,kiss,lick,pat,smug,bonk,yeet,blush,smile,wave,highfive,handhold,nom,bite,glomp,slap,kill,kick,happy,wink,poke,dance,cringe'.split(
		','
	)
};

/**
 * Find Waifu pictures from waifu.pics.
 * @param {NSFWTypes & SFWTypes} input
 * @param {WaifuTypes} type
 * @returns {Promise<string[] & {error?: string}>}
 */
export const getWaifu = async (input = 'neko', type = 'sfw') => {
	if (!(type in _type)) {
		return { error: `No data with the type : ${type}\nAvailable Type : ${Object.keys(_type).join(', ')}` };
	}

	if (!_type[type].includes(input)) {
		const hint = _type.nsfw.includes(input)
			? '\nThis input is in the nsfw section.'
			: _type.sfw.includes(input)
				? '\nThis input is in the sfw section.'
				: '';

		return {
			error: `No data with the input : ${input}\nCurrent option is ${type}\nList of ${type} : ${_type[type].join(', ')}.${hint}`
		};
	}

	const response = await fetch(_api(type, input), {
		method: 'POST',
		headers: { 'content-type': 'application/json;charset=UTF-8' },
		body: JSON.stringify({ exclude: [] })
	});

	const data = await response.json();

	return data.files;
};
