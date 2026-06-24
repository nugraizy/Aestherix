export function banned() {
	return async (ctx, next) => {
		if (ctx.isBanned) {
			void ctx.client.send(ctx.from, { react: { text: '🖕🏼', key: ctx.message.key } });
			return 'skip';
		}

		return next();
	};
}
