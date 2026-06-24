import { array, mixed, object, string } from 'yup';

import { COMMAND_SCHEMA } from './command-loader.js';

export const PLUGIN_SCHEMA = object({
	name: string()
		.required()
		.matches(/^[a-z0-9-]+$/, 'Plugin name must be lowercase alphanumeric with hyphens'),
	version: string()
		.required()
		.matches(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g. 1.0.0)'),
	description: string().optional().default(''),
	commands: array()
		.of(COMMAND_SCHEMA)
		.default([])
		.optional(),
	middleware: array()
		.of(
			mixed().test({
				test: (v) => typeof v === 'function',
				message: 'Middleware must be a function',
				name: 'middleware'
			})
		)
		.default([])
		.optional(),
	hooks: object()
		.shape({
			beforeCommand: mixed().test({
				test: (v) => v === undefined || typeof v === 'function',
				message: 'beforeCommand must be a function',
				name: 'beforeCommand'
			}),
			afterCommand: mixed().test({
				test: (v) => v === undefined || typeof v === 'function',
				message: 'afterCommand must be a function',
				name: 'afterCommand'
			}),
			onError: mixed().test({
				test: (v) => v === undefined || typeof v === 'function',
				message: 'onError must be a function',
				name: 'onError'
			})
		})
		.default({})
		.optional()
});

/** @type {(plugin: import('../types/Plugins/index.js').PluginDefinition) => import('../types/Plugins/index.js').PluginDefinition} */
export const definePlugin = (plugin) => plugin;
