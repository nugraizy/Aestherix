import configuration from '../config/connect.js';

let cachedPrefix = null;

export const getPrefix = (ctx) => {
	return ctx?.prefix ?? cachedPrefix ?? configuration.prefix.default ?? '.';
};

export const cmdId = (command, suffix = '', ctx) => {
	const p = ctx?.prefix ?? cachedPrefix ?? configuration.prefix.default ?? '.';

	return `${p}${command}${suffix ? ` ${suffix}` : ''}`;
};

export const setPrefix = (prefix) => {
	cachedPrefix = prefix ?? null;
};
