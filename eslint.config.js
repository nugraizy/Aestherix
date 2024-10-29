import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
	{
		languageOptions: {
			globals: {
				instance: true,
				client: true,
				where: true,
				log: true,
				store: true,
				Bun: true,
				...globals.node,
				...globals.browser
			}
		},
		rules: {
			'no-undef': 'error',
			'no-unsafe-optional-chaining': 0,
			'no-unused-vars': 'warn',
			'no-use-before-define': 1,
			'no-async-promise-executor': 'off',
			'no-mixed-spaces-and-tabs': 2,
			'no-dupe-keys': 1,
			'no-global-assign': 0,
			camelcase: 2,
			'no-empty': 2,
			curly: 2,
			'no-whitespace-before-property': 2,
			quotes: [2, 'single'],
			'padding-line-between-statements': [
				2,
				{
					blankLine: 'always',
					prev: ['const', 'let', 'var'],
					next: '*'
				},
				{
					blankLine: 'any',
					prev: ['const', 'let', 'var'],
					next: ['const', 'let', 'var']
				},
				{ blankLine: 'always', prev: ['if', 'for', 'function', 'block'], next: '*' },
				{ blankLine: 'always', next: ['if', 'for', 'function', 'block'], prev: '*' },
				{ blankLine: 'always', next: '*', prev: ['import'] },
				{ blankLine: 'any', prev: ['import'], next: ['import'] }
			]
		}
	},
	{
		ignores: ['eslint.config.js', 'todo/*', 'test/*']
	}
];
