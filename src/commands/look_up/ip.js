import parser from 'yargs-parser';

import { color, ERRLOG } from '../../utils/modules/index.js';
import { iplookup } from '../../utils/misc/index.js';

const regex = (input) =>
	/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/g.test(
		input
	);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'iplookup',
	description: 'Lookup IP Address',
	usage: '!iplookup <IPv4/IPv6>',
	aliases: ['iplook', 'ipfind'],
	category: 'Look-up',
	cooldown: 6,
	limit: 3,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify a IP Address', { from, quoted: message, groupMetadata });
		}

		let { _: IPs } = parser(query);

		if (IPs.length === 1 && !regex(IPs[0])) {
			return await client[botNum].reply('Please specify a valid IP Address', { from, quoted: message, groupMetadata });
		}

		for (const IP of IPs) {
			if (!regex(IP.trim())) {
				await client[botNum].reply('Please specify a valid IP Address', { from, quoted: message, groupMetadata });

				continue;
			}

			const data = await iplookup(IP.trim());

			if ('error' in data) {
				await client[botNum].reply(`Error while searching IP Address\n\n${data.error}`, {
					from,
					quoted: message,
					groupMetadata
				});

				ERRLOG(`⚠️ ${color('Failed to Searching IP Address', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			} else {
				const {
					continent,
					continentCode,
					country,
					countryCode,
					region,
					regionName,
					city,
					district,
					zip,
					lat,
					lon,
					timezone,
					offset,
					currency,
					isp,
					org,
					as,
					asname,
					reverse,
					mobile,
					proxy,
					hosting
				} = data;

				let capt = 'IP Address Lookup'.formatHeaders();

				capt += `\n\nContinent : ${continent}\n`;
				capt += `Continent Code : ${continentCode}\n`;
				capt += `Country : ${country}\n`;
				capt += `Country Code : ${countryCode}\n`;
				capt += `Region : ${region}\n`;
				capt += `Region Name : ${regionName}\n`;
				capt += `City : ${city}\n`;
				capt += `District : ${district}\n`;
				capt += `ZIP Code : ${zip}\n`;
				capt += `Latitude : ${lat}\n`;
				capt += `Longitude : ${lon}\n`;
				capt += `Timezone : ${timezone}\n`;
				capt += `Offset : ${offset}\n`;
				capt += `Currency : ${currency}\n`;
				capt += `ISP : ${isp}\n`;
				capt += `Organization : ${org}\n`;
				capt += `AS number & Organization : ${as}\n`;
				capt += `AS name : ${asname}\n`;
				capt += `Reverse DNS : ${reverse}\n`;
				capt += `Mobile Connection : ${mobile ? 'Yes' : 'No'}\n`;
				capt += `Proxy : ${proxy ? 'Yes' : 'No'}\n`;
				capt += `Hosting : ${hosting ? 'Yes' : 'No'}`;

				await client[botNum].send(from, { text: capt.trim() }, { groupMetadata, quoted: message });
			}
		}
	}
};
