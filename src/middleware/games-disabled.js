import { useLocale } from '../helper/i18n/index.js';

export function gamesDisabled() {
	return async (ctx, next) => {
		const { command, isGroup, isAdmin, from, message, client } = ctx;

		if (
			command.category === 'Games' &&
			isGroup &&
			!isAdmin &&
			ctx?.[from]?.games === 'disable'
		) {
			const L = useLocale(ctx.locale ?? 'id', 'common');

			void client.reply(from, L.core.errors.gameModeDisabled, message);
			return 'skip';
		}

		return next();
	};
}
