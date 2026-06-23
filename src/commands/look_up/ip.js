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
		const Ll = useLocale(locale, 'look_up');

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

				let capt = Ll.titles.ipLookup.formatHeaders();

				capt += `\n\n${Ll.labels.continent} : ${continent}\n`;
				capt += `${Ll.labels.continentCode} : ${continentCode}\n`;
				capt += `${Ll.labels.country} : ${country}\n`;
				capt += `${Ll.labels.countryCode} : ${countryCode}\n`;
				capt += `${Ll.labels.region} : ${region}\n`;
				capt += `${Ll.labels.regionName} : ${regionName}\n`;
				capt += `${Ll.labels.city} : ${city}\n`;
				capt += `${Ll.labels.district} : ${district}\n`;
				capt += `${Ll.labels.zipCode} : ${zip}\n`;
				capt += `${Ll.labels.latitude} : ${lat}\n`;
				capt += `${Ll.labels.longitude} : ${lon}\n`;
				capt += `${Ll.labels.timezone} : ${timezone}\n`;
				capt += `${Ll.labels.offset} : ${offset}\n`;
				capt += `${Ll.labels.currency} : ${currency}\n`;
				capt += `${Ll.labels.isp} : ${isp}\n`;
				capt += `${Ll.labels.organization} : ${org}\n`;
				capt += `${Ll.labels.asNumber} : ${as}\n`;
				capt += `${Ll.labels.asName} : ${asname}\n`;
				capt += `${Ll.labels.reverseDns} : ${reverse}\n`;
				capt += `${Ll.labels.mobileConnection} : ${mobile ? L.core.labels.yes : L.core.labels.no}\n`;
				capt += `${Ll.labels.proxy} : ${proxy ? L.core.labels.yes : L.core.labels.no}\n`;
				capt += `${Ll.labels.hosting} : ${hosting ? L.core.labels.yes : L.core.labels.no}`;

				await client.send(from, { text: capt.trim().formatForm() }, { quoted: message });
			}
		}
	}
});
