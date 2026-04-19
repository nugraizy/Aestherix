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

const applyInlineFormatting = (value) => {
	let formatted = escapeHtml(value);

	formatted = formatted.replace(/~~([^~]+)~~/g, '<del>$1</del>');
	formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

	return formatted;
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

		markup += applyInlineFormatting(source.slice(cursor, matchIndex));

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

	markup += applyInlineFormatting(source.slice(cursor));

	return markup;
};

export const renderChangelogMarkdown = (raw) => {
	const lines = String(raw ?? '').split(/\r?\n/);
	const releases = [];
	let currentRelease = null;
	let currentSection = null;
	let isInCodeBlock = false;
	let codeBuffer = [];
	let codeLanguage = '';

	const ensureRelease = () => {
		if (!currentRelease) {
			currentRelease = {
				title: 'Unreleased',
				sections: new Map(),
				sectionOrder: []
			};
			releases.push(currentRelease);
		}
	};

	const ensureSection = (label) => {
		ensureRelease();
		const key = label || 'Notes';
		if (!currentRelease.sections.has(key)) {
			currentRelease.sections.set(key, []);
			currentRelease.sectionOrder.push(key);
		}
		currentSection = key;
	};

	const pushItem = (item) => {
		ensureSection(currentSection || 'Notes');
		currentRelease.sections.get(currentSection).push(item);
	};

	const closeCodeBlock = () => {
		if (!isInCodeBlock) {
			return;
		}

		const codeValue = codeBuffer.join('\n');
		pushItem({
			type: 'code',
			value: escapeHtml(codeValue),
			language: codeLanguage
		});
		isInCodeBlock = false;
		codeBuffer = [];
		codeLanguage = '';
	};

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.startsWith('```')) {
			if (isInCodeBlock) {
				closeCodeBlock();
			} else {
				codeLanguage = trimmed.slice(3).trim();
				isInCodeBlock = true;
				codeBuffer = [];
			}
			continue;
		}

		if (isInCodeBlock) {
			codeBuffer.push(line);
			continue;
		}

		if (!trimmed) {
			continue;
		}

		if (trimmed === '---') {
			continue;
		}

		if (trimmed.startsWith('# ')) {
			const headingText = trimmed.slice(2).trim();

			if (headingText.toLowerCase() !== 'changelog') {
				currentRelease = {
					title: headingText,
					sections: new Map(),
					sectionOrder: []
				};
				releases.push(currentRelease);
				currentSection = null;
			}

			continue;
		}

		if (trimmed.startsWith('## ')) {
			ensureSection(trimmed.slice(3).trim());
			continue;
		}

		if (trimmed.startsWith('- ')) {
			pushItem({ type: 'text', value: formatInlineMarkdown(trimmed.slice(2).trim()) });
			continue;
		}

		pushItem({ type: 'text', value: formatInlineMarkdown(trimmed) });
	}

	closeCodeBlock();

	if (!releases.length) {
		return '';
	}

	const buildSectionLabelClass = (label) => {
		return String(label || 'notes')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	};

	const cardsMarkup = releases
		.map((release) => {
			const titleMarkup = formatInlineMarkdown(release.title);
			const sectionsMarkup = release.sectionOrder
				.map((label) => {
					const items = release.sections.get(label) || [];
					const labelClass = buildSectionLabelClass(label);
					const itemsMarkup = items
						.map((item) => {
							if (item.type === 'code') {
								const languageAttr = item.language ? ` data-language="${escapeHtml(item.language)}"` : '';
								return `<li class="is-code"><pre class="changelog-code"><code${languageAttr}>${item.value}</code></pre></li>`;
							}
							return `<li>${item.value}</li>`;
						})
						.join('');

					return `
						<section class="changelog-section-card">
							<div class="changelog-section-head">
								<span class="changelog-section-label label-${labelClass}">${formatInlineMarkdown(label)}</span>
							</div>
							<ul class="changelog-section-list">${itemsMarkup}</ul>
						</section>
					`;
				})
				.join('');

			return `
				<article class="changelog-card-item">
					<header class="changelog-card-head">
						<span class="changelog-version">${titleMarkup}</span>
					</header>
					<div class="changelog-card-body">
						${sectionsMarkup}
					</div>
				</article>
			`;
		})
		.join('');

	return `<div class="changelog-cards">${cardsMarkup}</div>`;
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
