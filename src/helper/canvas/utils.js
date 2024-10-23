export const roundedRectData = (w, h, tlr, trr, brr, blr) =>
	`M 0 ${tlr} A ${tlr} ${tlr}  0 0 1 ${tlr}  0 L ${w - trr} 0 A ${trr} ${trr} 0 0 1 ${w} ${trr} L ${w} ${
		h - brr
	} A ${brr} ${brr} 0 0 1 ${w - brr} ${h} L ${blr} ${h} A ${blr} ${blr} 0 0 1 0 ${h - blr} Z`;

export const colors = {
	dracula: {
		_default: '#bd93f9',
		background: '#282a36',
		'': '#f8f8f2',
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
		'regex-source language-regex': '#50fa7b',
		'class-name': '#8be9fd',
		number: '#ff79c6',
		boolean: 'white',
		operator: '#ff79c6',
		keyword: '#ff79c6',
		'attr-name': '#ff79c6',
		number: '#bd93f9',
		boolean: '#50fa7b',
		tag: '#ff79c6',
		important: '#ff5555',
		selector: '#50fa7b',
		entity: '#f8f8f2',
		'variable.language': '#ff79c6',
		'literal-property property': '#f8f8f2'
	}
};
