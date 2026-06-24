import { useLocale } from '../helper/i18n/index.js';
import { Limit } from '../helper/index.js';

export function roleCheck(configuration) {
	return async (ctx, next) => {
		const { command, isOwner, sender, from, message, client } = ctx;
		const L = useLocale(ctx.locale ?? 'id', 'common');

		if (command.category === 'Owner' && !isOwner) {
			void client.reply(from, L.core.errors.ownerOnly, message);
			return 'skip';
		}

		if (isOwner) {
			const isSelf = sender === configuration.botJid;

			if (isSelf) {
				const selfRole = Limit.checkRole(sender);

				if (command.premium && selfRole.role !== 'PREMIUM' && selfRole.role !== 'OWNER') {
					void client.reply(from, L.core.errors.premiumOnly, message);
					return 'skip';
				}

				return 'pass';
			}

			return 'pass';
		}

		if (command.category === 'Moderation') {
			if (!ctx.isGroup) {
				void client.reply(from, L.core.errors.groupOnly, message);
				return 'skip';
			}

			if (!ctx.isAdmin) {
				void client.reply(from, L.core.errors.adminOnly, message);
				return 'skip';
			}
		}

		const userRole = Limit.checkRole(sender);

		if (command.premium && userRole.role !== 'PREMIUM' && userRole.role !== 'OWNER') {
			void client.reply(from, L.core.errors.premiumOnly, message);
			return 'skip';
		}

		return next();
	};
}
