export const escapeHtml = (value) =>
	String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll(/'/g, '&#39;');

export const sanitizeMarkdownUrl = (rawUrl) => {
	const url = String(rawUrl ?? '').trim();

	if (/^(https?:\/\/|mailto:|\/|#)/i.test(url)) {
		return url;
	}

	return '';
};

export const formatInlineMarkdown = (value) => {
	const source = String(value ?? '');
	const tokenRegex = /\[`([^`]+)`\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;
	let cursor = 0;
	let markup = '';
	let match = tokenRegex.exec(source);

	while (match) {
		const matchIndex = match.index;
		const [fullMatch, codeLinkLabelRaw, codeLinkUrlRaw, plainLinkLabelRaw, plainLinkUrlRaw, inlineCodeRaw] = match;

		markup += escapeHtml(source.slice(cursor, matchIndex));

		if (inlineCodeRaw !== undefined) {
			markup += `<code>${escapeHtml(inlineCodeRaw)}</code>`;
		} else {
			const isCodeLabelLink = codeLinkLabelRaw !== undefined;
			const labelRaw = isCodeLabelLink ? codeLinkLabelRaw : plainLinkLabelRaw;
			const urlRaw = isCodeLabelLink ? codeLinkUrlRaw : plainLinkUrlRaw;
			const safeUrl = sanitizeMarkdownUrl(urlRaw);

			if (safeUrl) {
				const safeLabel = escapeHtml(labelRaw);
				const labelMarkup = isCodeLabelLink ? `<code>${safeLabel}</code>` : safeLabel;

				markup += `<a class="changelog-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${labelMarkup}</a>`;
			} else {
				markup += escapeHtml(fullMatch);
			}
		}

		cursor = matchIndex + fullMatch.length;
		match = tokenRegex.exec(source);
	}

	markup += escapeHtml(source.slice(cursor));

	return markup;
};

export const renderChangelogMarkdown = (raw) => {
	const lines = String(raw ?? '').split(/\r?\n/);
	const htmlParts = [];
	let isInList = false;
	let isInCodeBlock = false;

	const closeList = () => {
		if (!isInList) {
			return;
		}

		htmlParts.push('</ul>');
		isInList = false;
	};

	const closeCodeBlock = () => {
		if (!isInCodeBlock) {
			return;
		}

		htmlParts.push('</code></pre>');
		isInCodeBlock = false;
	};

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.startsWith('```')) {
			closeList();

			if (isInCodeBlock) {
				closeCodeBlock();
			} else {
				const language = trimmed.slice(3).trim();
				const languageAttr = language ? ` data-language="${escapeHtml(language)}"` : '';

				htmlParts.push(`<pre class="changelog-code"><code${languageAttr}>`);
				isInCodeBlock = true;
			}

			continue;
		}

		if (isInCodeBlock) {
			htmlParts.push(`${escapeHtml(line)}\n`);
			continue;
		}

		if (!trimmed) {
			closeList();
			continue;
		}

		if (trimmed === '---') {
			closeList();
			htmlParts.push('<hr class="changelog-separator" />');
			continue;
		}

		if (trimmed.startsWith('# ')) {
			closeList();

			const headingText = trimmed.slice(2).trim();

			if (headingText.toLowerCase() !== 'changelog') {
				htmlParts.push(`<h3 class="changelog-release">${formatInlineMarkdown(headingText)}</h3>`);
			}

			continue;
		}

		if (trimmed.startsWith('## ')) {
			closeList();
			htmlParts.push(`<p class="changelog-section">${formatInlineMarkdown(trimmed.slice(3).trim())}</p>`);
			continue;
		}

		if (trimmed.startsWith('- ')) {
			if (!isInList) {
				htmlParts.push('<ul class="changelog-list">');
				isInList = true;
			}

			htmlParts.push(`<li>${formatInlineMarkdown(trimmed.slice(2).trim())}</li>`);
			continue;
		}

		closeList();
		htmlParts.push(`<p class="changelog-note">${formatInlineMarkdown(trimmed)}</p>`);
	}

	closeCodeBlock();
	closeList();

	return htmlParts.join('');
};

export const fuzzyIncludes = (haystack, needle) => {
	const source = String(haystack || '').toLowerCase();
	const query = String(needle || '').toLowerCase();

	if (!query) {
		return true;
	}

	if (source.includes(query)) {
		return true;
	}

	let pointer = 0;

	for (let i = 0; i < source.length && pointer < query.length; i += 1) {
		if (source[i] === query[pointer]) {
			pointer += 1;
		}
	}

	return pointer === query.length;
};

export const highlightMatch = (value, query) => {
	const raw = String(value ?? '');
	const keyword = String(query || '')
		.trim()
		.toLowerCase();

	if (!keyword) {
		return escapeHtml(raw);
	}

	const lower = raw.toLowerCase();
	const index = lower.indexOf(keyword);

	if (index === -1) {
		return escapeHtml(raw);
	}

	const start = raw.slice(0, index);
	const hit = raw.slice(index, index + keyword.length);
	const end = raw.slice(index + keyword.length);

	return `${escapeHtml(start)}<mark class="search-hit">${escapeHtml(hit)}</mark>${escapeHtml(end)}`;
};
