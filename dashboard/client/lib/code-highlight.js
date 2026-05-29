function esc(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightCode(code, language = 'js') {
	let pattern;

	if (language === 'json' || language === 'js') {
		pattern = new RegExp(
			[
				'(\\/\\/.*$)',
				'("(?:[^"\\\\]|\\\\.)*")',
				"('(?:[^'\\\\]|\\\\.)*')",
				'(`(?:[^`\\\\]|\\\\.)*`)',
				'\\b(true|false|null|undefined|NaN|Infinity)\\b',
				'\\b(\\d+\\.?\\d*)\\b',
				'\\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|class|new|this|throw|try|catch|default|switch|case|break|continue|typeof|instanceof|of|in)\\b'
			].join('|'),
			'gm'
		);
	} else if (language === 'css') {
		pattern = new RegExp(
			[
				'(\\/\\*[\\s\\S]*?\\*\\/)',
				'([.#][\\w-]+)',
				'(\\d+\\.?\\d*(?:px|rem|em|%|vh|vw|s|ms)?)',
				'("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')'
			].join('|'),
			'gm'
		);
	} else if (language === 'html') {
		pattern = new RegExp(
			['(<!--[\\s\\S]*?-->)', '(<\\/?[\\w-]+)', '([\\w-]+)(?==)', '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')'].join(
				'|'
			),
			'gm'
		);
	} else {
		return esc(code);
	}

	let result = '';
	let lastIndex = 0;

	for (const match of code.matchAll(pattern)) {
		const start = match.index;
		const text = match[0];

		if (start > lastIndex) {
			result += esc(code.slice(lastIndex, start));
		}

		const cls = classifyMatch(text, language);

		result += `<span class="hl-${cls}">${esc(text)}</span>`;
		lastIndex = start + text.length;
	}

	if (lastIndex < code.length) {
		result += esc(code.slice(lastIndex));
	}

	return result;
}

function classifyMatch(text, language) {
	if (language === 'json' || language === 'js') {
		if (text.startsWith('//')) {
			return 'comment';
		}

		if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
			return 'string';
		}

		if (/^(true|false|null|undefined|NaN|Infinity)$/.test(text)) {
			return 'atom';
		}

		if (/^\d/.test(text)) {
			return 'number';
		}

		return 'keyword';
	}

	if (language === 'css') {
		if (text.startsWith('/*')) {
			return 'comment';
		}

		if (text.startsWith('.') || text.startsWith('#')) {
			return 'keyword';
		}

		if (text.startsWith('"') || text.startsWith("'")) {
			return 'string';
		}

		return 'number';
	}

	if (language === 'html') {
		if (text.startsWith('<!--')) {
			return 'comment';
		}

		if (text.startsWith('<')) {
			return 'keyword';
		}

		if (text.startsWith('"') || text.startsWith("'")) {
			return 'string';
		}

		return 'property';
	}

	return 'keyword';
}
