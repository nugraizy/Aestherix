export class MiddlewareChain {
	#stack = [];

	use(middleware) {
		if (typeof middleware !== 'function') {
			throw new TypeError('Middleware must be a function');
		}

		this.#stack.push(middleware);
		return this;
	}

	remove(middleware) {
		const index = this.#stack.indexOf(middleware);

		if (index !== -1) {
			this.#stack.splice(index, 1);
		}

		return this;
	}

	clear() {
		this.#stack = [];
		return this;
	}

	get size() {
		return this.#stack.length;
	}

	async execute(ctx) {
		let index = 0;

		const next = async () => {
			if (index >= this.#stack.length) {
				return 'pass';
			}

			const middleware = this.#stack[index++];
			let nextCalled = false;
			let result = 'pass';

			const nextFn = async () => {
				nextCalled = true;
				result = await next();
				return result;
			};

			const middlewareResult = await middleware(ctx, nextFn);

			if (!nextCalled) {
				return middlewareResult ?? 'skip';
			}

			return result;
		};

		return next();
	}
}
