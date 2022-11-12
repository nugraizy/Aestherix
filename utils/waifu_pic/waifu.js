import axios from 'axios';

const _api = (type, input) => `https://api.waifu.pics/many/${type}/${input}`;

/**
 * @typedef {'nsfw' | 'sfw'} WaifuTypes
 * @typedef {'waifu' | 'neko' | 'trap' | 'blowjob'} NSFWTypes
 * @typedef {'waifu' | 'neko' | 'shinobu' | 'megumin' | 'bully' | 'cuddle' | 'cry' | 'hug' | 'awoo' | 'kiss' | 'lick' | 'pat' | 'smug' | 'bonk' | 'yeet' | 'blush' | 'smile' | 'wave' | 'highfive' | 'handhold' | 'nom' | 'bite' | 'glomp' | 'slap' | 'kill' | 'kick' | 'happy' | 'wink' | 'poke' | 'dance' | 'cringe'} SFWTypes
 */
const _type = {
	nsfw: 'waifu,neko,trap,blowjob'.split(','),
	sfw: 'waifu,neko,shinobu,megumin,bully,cuddle,cry,hug,awoo,kiss,lick,pat,smug,bonk,yeet,blush,smile,wave,highfive,handhold,nom,bite,glomp,slap,kill,kick,happy,wink,poke,dance,cringe'.split(
		',',
	),
};

/**
 * Find Waifu pictures from waifu.pics.
 * @param {NSFWTypes & SFWTypes} input
 * @param {WaifuTypes} type
 * @returns {Promise<string[] & {error?: string}>}
 * @throws {Error}
 */
export const getWaifu = (input = 'neko', type = 'sfw') =>
	new Promise(async (resolve, reject) => {
		try {
			if (!Object.keys(_type).includes(type)) {
				return resolve({ error: `No data with the type : ${type}\nAvailable Type : ${Object.keys(_type).join(', ')}`.trim() });
			}

			if (!_type[type].includes(input)) {
				return resolve({
					error: `No data with the input : ${input}\nCurrent option are ${type}\nList of ${type} : ${_type[type].join(', ')}.\n${
						_type.nsfw.find((v) => v == input) ? '\nThis input are on nsfw section.' : _type.sfw.find((v) => v == input) ? '\nThis input are on sfw section.' : ''
					}`.trim(),
				});
			}

			const { data } = await axios.post(_api(type, input), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
				data: { exclude: [] },
			});

			resolve(data.files);
		} catch (err) {
			reject(err);
		}
	});
