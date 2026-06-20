import parser from 'yargs-parser';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { iplookup } from '../../utils/misc/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) =>
	/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/g.test(
		input
	);

export default defineCommand({
	name: 'iplookup',
	minifiedDescription: 'Look-up IP Address',
	description: 'Look-up IP Address.',
	usage: '!iplookup `<IPv4/IPv6>`',
	aliases: ['iplook', 'ipfind'],
	category: 'Look-up',
	cooldown: 6,
	limit: 3,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.ipRequired, message);
		}

		let { _: IPs } = parser(query);

		if (IPs.length === 1 && !regex(IPs[0])) {
			return await client.reply(from, L.errors.ipInvalid, message);
		}

		for (const IP of IPs) {
			if (!regex(IP.trim())) {
				await client.reply(from, L.errors.ipInvalid, message);

				continue;
			}

			const data = await iplookup(IP.trim());

			if (data?.error) {
				await client.reply(from, `${L.errors.failedSearch}\n\n${data.error}`, message);

				loggers.error(`${color('Failed to Searching IP Address', 'red')} for ${color(prettyNumber, 'lilac')}`);

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

				await client.send(from, { text: capt.trim().formatForm() }, { quoted: message });
			}
		}
	}
});
