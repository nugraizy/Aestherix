import { t } from '../helper/i18n/index.js';
import { Limit } from '../helper/index.js';

export function usageLimit(flags) {
	return async (ctx, next) => {
		if (flags.unlimited) {
			return next();
		}

		const { sender, command, from, message, client } = ctx;
		const userRole = Limit.checkRole(sender);

		if (!Limit.checkExist(sender) && userRole.role !== 'OWNER' && userRole.role !== 'PREMIUM') {
			Limit.upsert(sender, 0, userRole.role);
		}

		const limit = Limit.reduceLimit(sender, command.limit);

		if (limit.error) {
			void client.reply(
				from,
				t(ctx.locale ?? 'id', 'common.core.errors.commandLimitExceeded', [command.name, command.limit]),
				message
			);

			return 'skip';
		}

		return next();
	};
}
