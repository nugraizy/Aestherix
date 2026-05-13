import dayjs from 'dayjs';

import { epicgames, epicgamesFree } from '../../utils/index.js';

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

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return client.reply(from, 'You must provide a query.', message);
		}

		if (query === '--free') {
			const result = await epicgamesFree();

			if (result?.error) {
				return await client.reply(from, result.error, message);
			}

			let caption = `${'Free Epicgames'.formatHeaders()}

${result
	.filter((v) => v.promotions)
	.sort((a, b) => (b.promotions.promotionalOffers.length > 0 ? 1 : 0) - (a.promotions.promotionalOffers.length > 0 ? 1 : 0))
	.map(
		(v) => `Title : ${v.title}
Description : ${v.description}
Publisher : ${v.seller.name}
Categories : ${v.categories.map((w) => w.path).join(', ')}
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

		let caption = `${'Epicgames'.formatHeaders()}

${result
	.map(
		(v) => `Title : ${v.title}
Description : ${v.description}
Publisher : ${v.seller.name}
Categories : ${v.categories.map((w) => w.path).join(', ')}
Discount Price : ${v.price.totalPrice.fmtPrice.discountPrice}
Original Price : ${v.price.totalPrice.fmtPrice.originalPrice}
https://store.epicgames.com/p/${v.urlSlug}`
	)
	.join('\n\n')}`.trim();

		await client.sendMessage(from, { image: { url: result[0].keyImages[0].url }, caption }, { quoted: message });
	}
};
