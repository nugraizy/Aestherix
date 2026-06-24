import { t } from '../helper/i18n/index.js';

const HEAVY_CATEGORIES = new Set(['Downloader', 'Converter', 'Search', 'AI', 'Anime']);

export function executionLock(executionLocks) {
	return async (ctx, next) => {
		const { command, sender, from, message, client } = ctx;

		if (HEAVY_CATEGORIES.has(command.category)) {
			const lock = executionLocks.get(sender);

			if (lock) {
				if (Date.now() > lock.expiry) {
					executionLocks.delete(sender);
				} else {
					void client.reply(
						from,
						t(ctx.locale ?? 'id', 'common.core.errors.executionLocked', [lock.command]),
						message
					);

					return 'skip';
				}
			}
		}

		return next();
	};
}
