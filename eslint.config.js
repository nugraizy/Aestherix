import globals from 'globals';

export default [
	{
		languageOptions: {
			globals: {
				// All bot-specific globals have been migrated. Bun stays for
				// runtime detection.
				Bun: true,
				...globals.node,
				...globals.browser
			}
		},
		rules: {
			'no-undef': 'error',
			'no-unsafe-optional-chaining': 'off',
			'no-unused-vars': 'warn',
			'no-use-before-define': 'warn',
			'no-async-promise-executor': 'off',
			'no-mixed-spaces-and-tabs': 'error',
			'no-dupe-keys': 'warn',
			'no-global-assign': 'off',
			camelcase: [
				'error',
				{
					properties: 'never'
				}
			],
			'no-empty': 'error',
			curly: 'error',
			'no-whitespace-before-property': 'error',
			quotes: ['error', 'single'],
			'padding-line-between-statements': [
				'error',
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
		ignores: ['eslint.config.js', 'todo/*', 'test/*', 'dashboard/**/node_modules/**', 'dashboard/**/dist/**', 'public/**']
	}
];
