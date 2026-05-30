export async function copyText(text) {
	const value = String(text ?? '');

	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return true;
		}
	} catch {
		// fall through to the legacy path below
	}

	try {
		const textarea = document.createElement('textarea');

		textarea.value = value;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();

		const ok = document.execCommand('copy');

		textarea.remove();

		return ok;
	} catch {
		return false;
	}
}
