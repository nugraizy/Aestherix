import dayjs from 'dayjs';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { epicgames, epicgamesFree } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const formatDate = (dateString, timeZone = 'Asia/Jakarta') =>
	`\`${dayjs.utc(dateString).tz(timeZone).format('hh:mm A DD/MM/YYYY')}\``;

const processPromotion = (data) => {
	if (data.promotions.upcomingPromotionalOffers.length > 0) {
		return `~${data.price.totalPrice.fmtPrice.originalPrice}~ Upcoming free games started at ${formatDate(
			data.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate
		)}, Ending at ${formatDate(data.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].endDate)}`;
	} else {
		return `~${data.price.totalPrice.fmtPrice.originalPrice}~ Free until ${formatDate(
			data.promotions.promotionalOffers[0].promotionalOffers[0].endDate
		)}`;
	}
};

export default defineCommand({
	name: 'epicgames',
	minifiedDescription: 'Search Epicgames',
	description: 'Search games from Epicgames.',
	usage: '!epicgames `<query/--free>`',
	aliases: ['epgames'],
	category: 'Search',
	cooldown: 3,
	limit: 2,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		if (query === '--free') {
			const result = await epicgamesFree();

			if (result?.error) {
				return await client.reply(from, result.error, message);
			}

			let caption = `${Ls.titles.freeEpicgames.formatHeaders()}

${result
	.filter((v) => v.promotions)
	.sort((a, b) => (b.promotions.promotionalOffers.length > 0 ? 1 : 0) - (a.promotions.promotionalOffers.length > 0 ? 1 : 0))
	.map(
		(v) => `Title : ${v.title}
${Ls.labels.description} : ${v.description}
${Ls.labels.publisher} : ${v.seller.name}
${Ls.labels.categories} : ${v.categories.map((w) => w.path).join(', ')}
${processPromotion(v)}
https://store.epicgames.com/p/${v.productSlug}`
	)
	.join('\n\n')}`.trim();

			return await client.sendMessage(
				from,
				{ image: { url: result[0].keyImages.find((v) => v.type === 'Thumbnail').url }, caption },
				{ quoted: message }
			);
		}

		const result = await epicgames(query);

		if (result?.error) {
			return await client.reply(from, result.error, message);
		}

		let caption = `${Ls.titles.epicgames.formatHeaders()}

${result
	.map(
		(v) => `Title : ${v.title}
${Ls.labels.description} : ${v.description}
${Ls.labels.publisher} : ${v.seller.name}
${Ls.labels.categories} : ${v.categories.map((w) => w.path).join(', ')}
${Ls.labels.discountPrice} : ${v.price.totalPrice.fmtPrice.discountPrice}
${Ls.labels.originalPrice} : ${v.price.totalPrice.fmtPrice.originalPrice}
https://store.epicgames.com/p/${v.urlSlug}`
	)
	.join('\n\n')}`.trim();

		await client.sendMessage(from, { image: { url: result[0].keyImages[0].url }, caption }, { quoted: message });
	}
});
