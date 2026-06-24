import { t, useLocale } from '../helper/i18n/index.js';

export function disabledCommand(configuration, retryManager) {
	return async (ctx, next) => {
		const { command, from, message, client, isOwner } = ctx;
		const disabled = configuration.registry.disabledCommands;

		if (disabled?.has(command.name)) {
			void client.reply(
				from,
				t(ctx.locale ?? 'id', 'common.core.errors.commandDisabledDashboard', [command.name]),
				message
			);

			return 'skip';
		}

		if (retryManager.isDisabled(command.name)) {
			const remaining = retryManager.getDisableRemaining(command.name);
			const L = useLocale(ctx.locale ?? 'id', 'common');

			if (isOwner) {
				const builder = new client.TemplateBuilder.Native();

				await builder
					.destination(from)
					.body(t(ctx.locale ?? 'id', 'common.core.errors.commandDisabled', [command.name, remaining]))
					.buttons(builder.button.reply({ display: L.core.success.enable, id: `enable:${command.name}` }))
					.send();
			} else {
				void client.reply(
					from,
					t(ctx.locale ?? 'id', 'common.core.errors.commandDisabled', [command.name, remaining]),
					message
				);
			}

			return 'skip';
		}

		return next();
	};
}
