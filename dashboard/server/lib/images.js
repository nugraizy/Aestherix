export function getSafeHttpUrl(value) {
	const normalized = String(value || '').trim();

	if (!/^https?:\/\//i.test(normalized)) {
		return '';
	}

	return normalized;
}

export function getImageVariantsFromMap(images) {
	if (!images || typeof images !== 'object') {
		return [];
	}

	const variants = [];

	for (const [key, value] of Object.entries(images)) {
		const url = getSafeHttpUrl(value?.url || value);

		if (!url) {
			continue;
		}

		const width = Number(value?.width || String(key).match(/(\d+)x/i)?.[1] || 0);
		const height = Number(value?.height || String(key).match(/x(\d+)/i)?.[1] || 0);

		variants.push({
			url,
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		});
	}

	return variants;
}

export function toImageVariant(variant, fallbackUrl) {
	const variantUrl = getSafeHttpUrl(variant?.url) || getSafeHttpUrl(variant) || fallbackUrl;

	if (!variantUrl) {
		return null;
	}

	if (variant && typeof variant === 'object') {
		return { ...variant, url: variantUrl };
	}

	return { url: variantUrl };
}

export function normalizeDashboardPicture(value) {
	const variants = getImageVariantsFromMap(value?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(value?.original?.url) ||
		getSafeHttpUrl(value?.url) ||
		getSafeHttpUrl(value?.original) ||
		getSafeHttpUrl(value?.image_url) ||
		getSafeHttpUrl(value?.image) ||
		getSafeHttpUrl(value?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		getSafeHttpUrl(value);

	if (!originalUrl) {
		return null;
	}

	const original = toImageVariant(value?.original, originalUrl) || { url: originalUrl };
	const thumbnail = toImageVariant(
		value?.thumbnail,
		getSafeHttpUrl(value?.thumbnail?.url) ||
			getSafeHttpUrl(value?.previewUrl) ||
			getSafeHttpUrl(value?.thumbnail) ||
			getSafeHttpUrl(value?.images?.['474x']?.url) ||
			getSafeHttpUrl(value?.images?.['236x']?.url) ||
			sortedByArea.at(-1)?.url ||
			originalUrl
	) || { url: originalUrl };

	return { original, thumbnail };
}

export function normalizePersistedPictureEntry(entry) {
	const normalized = normalizeDashboardPicture(entry);

	if (!normalized) {
		return null;
	}

	// Attach colorPalette if present in the entry
	if (entry && entry.colorPalette) {
		normalized.colorPalette = entry.colorPalette;
	}

	return normalized;
}

export function normalizeHexColor(value) {
	const normalized = String(value || '')
		.trim()
		.replace(/^#/, '');

	if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
		const expanded = normalized
			.split('')
			.map((c) => `${c}${c}`)
			.join('');

		return `#${expanded.toLowerCase()}`;
	}

	if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
		return `#${normalized.toLowerCase()}`;
	}

	if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
		return `#${normalized.slice(0, 6).toLowerCase()}`;
	}

	return '';
}

export function hexToRgb(value) {
	const normalized = normalizeHexColor(value);

	if (!normalized) {
		return null;
	}

	const hex = normalized.slice(1);

	return {
		r: Number.parseInt(hex.slice(0, 2), 16),
		g: Number.parseInt(hex.slice(2, 4), 16),
		b: Number.parseInt(hex.slice(4, 6), 16)
	};
}

export function rgbToHex({ r = 0, g = 0, b = 0 } = {}) {
	const toHex = (channel) => {
		const safe = Math.max(0, Math.min(255, Number(channel) || 0));

		return safe.toString(16).padStart(2, '0');
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbDistance(left, right) {
	if (!left || !right) {
		return Number.POSITIVE_INFINITY;
	}

	const deltaR = Number(left.r || 0) - Number(right.r || 0);
	const deltaG = Number(left.g || 0) - Number(right.g || 0);
	const deltaB = Number(left.b || 0) - Number(right.b || 0);

	return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
}

export function normalizePersistedUserJid(input, suffix = '@s.whatsapp.net') {
	let raw = String(input || '').trim();

	if (!raw) {
		return null;
	}

	if (raw.endsWith('@c.us')) {
		raw = raw.replace(/@c\.us$/i, suffix);
	}

	if (raw.endsWith(suffix)) {
		const local = raw.split('@')[0].replace(/\D/g, '');

		return local ? `${local}${suffix}` : null;
	}

	const digits = raw.replace(/\D/g, '');

	if (!digits) {
		return null;
	}

	return `${digits}${suffix}`;
}
