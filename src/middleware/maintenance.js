import { useLocale } from '../helper/i18n/index.js';

export function maintenance(configuration) {
	return async (ctx, next) => {
		if (configuration.settings?.maintenance && !ctx.isOwner) {
			const L = useLocale(ctx.locale ?? 'id', 'common');

			void ctx.client.reply(ctx.from, L.core.errors.maintenance, ctx.message);
			return 'skip';
		}

		return next();
	};
}
