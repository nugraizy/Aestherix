import { t } from '../helper/i18n/index.js';

export function cooldown(router, flags) {
	return async (ctx, next) => {
		if (!flags.coolDown) {
			return next();
		}

		const { onCooldown, remaining } = router.checkCooldown(ctx.sender, ctx.command.name, ctx.command.cooldown);

		if (onCooldown) {
			void ctx.client.reply(
				ctx.from,
				t(ctx.locale ?? 'id', 'common.core.errors.commandOnCooldown', [ctx.command.name, remaining]),
				ctx.message
			);

			return 'skip';
		}

		return next();
	};
}
