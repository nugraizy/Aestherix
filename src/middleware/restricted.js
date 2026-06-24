import { useLocale } from '../helper/i18n/index.js';

export function restricted(flags) {
	return async (ctx, next) => {
		if (flags.restrict && ctx.command.restrict) {
			const L = useLocale(ctx.locale ?? 'id', 'common');

			void ctx.client.reply(ctx.from, L.core.errors.restricted, ctx.message);
			return 'skip';
		}

		return next();
	};
}
