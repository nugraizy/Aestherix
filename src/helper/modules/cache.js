import _ from 'lodash';

const { isEqualWith } = _;

/**
 * @typedef {string | number} Key
 */

/**
 * A simple cache implementation.
 */
export class Cache {
	/**
	 * Creates a new Cache instance.
	 * @param {Object} options - Cache options.
	 * @param {number} [options.limit=Infinity] - The maximum number of items in the cache.
	 * @param {boolean} [options.throws=false] - Whether to throw errors on certain operations.
	 * @param {boolean} [options.allowOverwrite=true] - Allowing to overwrite the value. If allowOverwrite=false while throws=true and tried to overwrite it will throws error.
	 */
	#limit;
	#throws;
	#allowOverwrite;
	#count;

	constructor({ limit = Infinity, throws = false, allowOverwrite = true } = {}) {
		/**
		 * The maximum number of items in the cache.
		 * @type {number}
		 * @private
		 */
		this.#limit = limit;

		/**
		 * Whether to throw errors on certain operations.
		 * @type {boolean}
		 * @private
		 */
		this.#throws = throws;

		/**
		 * Allowing to overwrite the value. If allowOverwrite=false while throws=true and tried to overwrite it will throws error.
		 * @type {boolean}
		 * @private
		 */
		this.#allowOverwrite = allowOverwrite;

		/**
		 * The cache data.
		 * @type {{ [key: Key]: any }}
		 */
		this.cache = Object.create(null);

		/**
		 * The current count of items in the cache.
		 * @type {number}
		 * @private
		 */
		this.#count = 0;
	}

	/**
	 * Returns the current size of the cache.
	 * @type {number}
	 */
	get size() {
		return this.#count;
	}

	/**
	 * Returns an array of keys in the cache.
	 * @returns {Key[]}
	 */
	keys() {
		return Object.keys(this.cache);
	}

	/**
	 * Checks if a key exists in the cache.
	 * @param {Key} key - The key to check.
	 * @returns {boolean}
	 */
	has(key) {
		return !!this.cache[key];
	}

	/**
	 * Returns an array of key-value pairs in the cache.
	 * @returns {[Key, any][]}
	 */
	entries() {
		return Object.entries(this.cache);
	}

	/**
	 * Returns an object containing values from the cache and a function to find keys by value.
	 * @returns {{ values: any[], returns: (value: any) => Key | null }}
	 */
	values() {
		const returnsKey = (value) => {
			return (
				Object.entries(this.cache).find(([, val]) => {
					if (typeof val === 'object') {
						return isEqualWith(val, value);
					}

					return val === value;
				})?.[0] || null
			);
		};

		return {
			values: Object.values(this.cache),
			returns: returnsKey
		};
	}

	/**
	 * Filters the elements in the cache based on the provided function and action.
	 *
	 * @param {(key: Key, value: any) => boolean} func - The filtering function that evaluates each element in the cache.
	 * @param {'remove' | 'find' | 'filter'} action - The action to perform ('remove', 'find', or 'filter').
	 * @throws {TypeError} Throws an error if the provided 'action' is not one of 'remove', 'find', or 'filter'.
	 * @returns {Object|Array|null|this} Depending on the 'action' parameter:
	 *   - If 'action' is 'remove', returns the updated Cache instance after removing matching elements.
	 *   - If 'action' is 'find', returns the first matching element as an object { key, value }, or null if none is found.
	 *   - If 'action' is 'filter', returns an array of matching elements as an array of objects [{ key, value }].
	 *   - Throws a TypeError if 'action' is not valid ('remove', 'find', or 'filter').
	 */
	filter(func, action) {
		if (action === 'remove') {
			for (const key in this.cache) {
				if (func(key, this.cache[key])) {
					this.delete(key);
				}
			}

			return this;
		} else if (action === 'find') {
			for (const key in this.cache) {
				if (func(key, this.cache[key])) {
					return this.cache[key];
				}
			}

			return null;
		} else if (action === 'filter') {
			let container = [];

			for (const key in this.cache) {
				if (func(key, this.cache[key])) {
					container.push(this.cache[key]);
				}
			}

			return container;
		} else {
			throw new TypeError('`action` expected. the value is either `find` or `remove`');
		}
	}

	/**
	 * Get a value from the cache.
	 * @param {Key} key - The key to retrieve.
	 * @returns {any | null}
	 */
	get(key) {
		if (!this.cache[key]) {
			if (this.#throws) {
				throw new Error('Key not found');
			}

			return null;
		}

		return this.cache[key];
	}

	/**
	 * Set a value in the cache.
	 * @param {Key} key - The key to set.
	 * @param {any} value - The value to store.
	 * @returns {this}
	 */
	set(key, value) {
		this.#count++;

		if (this.#count > this.#limit) {
			this.delete(this.keys()[0]);
			this.#count--;
		}

		if (!this.#allowOverwrite && this.cache[key]) {
			if (this.#throws) {
				throw new Error('Key already exists');
			}

			return this;
		}

		this.cache[key] = value;

		return this;
	}

	/**
	 * Delete a key from the cache.
	 * @param {Key} key - The key to delete.
	 * @returns {this}
	 */
	delete(key) {
		if (!this.cache[key]) {
			if (this.#throws) {
				throw new Error('Key not found');
			}

			return this;
		}

		delete this.cache[key];
		this.#count--;

		return this;
	}

	/**
	 * Clears the cache.
	 * @returns {this}
	 */
	clear() {
		this.cache = Object.create(null);
		this.#count = 0;
		return this;
	}

	/**
	 * Iterate over all cache entries and apply a function.
	 * @param {(value: any, key: Key, cache: { [key: Key]: any }) => void} func - The function to apply to each entry.
	 * @returns {this}
	 */
	forEach(func) {
		if (typeof func !== 'function') {
			if (this.#throws) {
				throw new TypeError('`func` expected a function');
			}

			return this;
		}

		for (const key in this.cache) {
			func(this.cache[key], key, this.cache);
		}

		return this;
	}

	/**
	 * Flushes the cache.
	 * @returns {void}
	 */
	flushAll() {
		this.clear();
	}

	/**
	 * Get a value from the cache by index.
	 * @param {number} index - The index to retrieve.
	 * @throws {TypeError} Throws an error if the index is not a number or the number is out of bounds.
	 * @returns {{key: Key, value: any} | null} Returns an object { key, value } or null if the index is out of bounds.
	 */
	index(index) {
		if (index < 0 || index > this.size - 1 || typeof index !== 'number') {
			if (this.#throws) {
				throw new Error('Index out of bounds');
			}

			return null;
		}

		const key = this.keys()[index];

		return { key, value: this.cache[this.keys()[index]] };
	}
}
