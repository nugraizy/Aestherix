export function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function escapeRegex(value) {
	return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlight(text, term, cssClass = 'cmd-hl') {
	const safe = escapeHtml(text);
	const trimmed = String(term || '').trim();

	if (!trimmed) {
		return safe;
	}

	const pattern = new RegExp(`(${escapeRegex(trimmed)})`, 'gi');

	return safe.replace(pattern, `<mark class="${cssClass}">$1</mark>`);
}
