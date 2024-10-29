export const roundedRectData = (width, height, cornerRadius) =>
	`M ${cornerRadius} 0
H ${width - cornerRadius}
A ${cornerRadius} ${cornerRadius} 0 0 1 ${width} ${cornerRadius}
V ${height - cornerRadius}
A ${cornerRadius} ${cornerRadius} 0 0 1 ${width - cornerRadius} ${height}
H ${cornerRadius}
A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${height - cornerRadius}
V ${cornerRadius}
A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} 0 Z`;

export const colors = {
	dracula: {
		_default: '#f8f8f2',
		background: '#282a36',
		'': '#bd93f9',
		'function-variable function': '#50fa7b',
		comment: '#6272a4',
		constant: '#bd93f9',
		'string-property property': '#f1fa8c',
		string: '#f1fa8c',
		variable: '#ff79c6',
		'template-punctuation string': '#f1fa8c',
		'interpolation-punctuation punctuation': '#f8f8f2',
		interpolation: '#f8f8f2',
		parameter: '#FFB86C',
		function: '#50fa7b',
		punctuation: '#f8f8f2',
		'regex-flags': '#ff79c6',
		'regex-delimiter': '#ff5555',
		'regex-source language-regex': '#bd93f9',
		'class-name': '#8be9fd',
		operator: '#ff79c6',
		keyword: '#ff79c6',
		'attr-name': '#ff79c6',
		number: '#bd93f9',
		boolean: '#bd93f9',
		tag: '#ff79c6',
		important: '#ff5555',
		selector: '#50fa7b',
		entity: '#f8f8f2',
		'variable.language': '#ff79c6',
		'literal-property property': '#f8f8f2'
	},
	synthwave84: {
		_default: '#ff7ed5',
		background: '#262335',
		'': '#ff7ed5',
		'function-variable function': '#72f1b8',
		comment: '#8e8e8e',
		constant: '#ff7ed5',
		'string-property property': '#f87c32',
		string: '#f87c32',
		variable: '#67cdcc',
		'template-punctuation string': '#f87c32',
		'interpolation-punctuation punctuation': '#ff7ed5',
		interpolation: '#f87c32',
		parameter: '#f4eee4',
		function: '#fdfdfd',
		punctuation: '#ccc',
		'regex-flags': '#f87c32',
		'regex-delimiter': '#e2777a',
		'regex-source language-regex': '#e2777a',
		'class-name': '#fff5f6',
		number: '#e2777a',
		boolean: '#fdfdfd',
		operator: '#67cdcc',
		keyword: (text) => {
			return text === 'const' ? '#c8d25d' : '#66f19b';
		},
		'attr-name': '#e2777a',
		tag: '#e2777a',
		important: '#f4eee4',
		selector: '#72f1b8',
		entity: '#67cdcc',
		'variable.language': '#67cdcc',
		'literal-property property': '#f87c32'
	}
};
