let cachedRenderer = null;

function postProcess(html) {
	let output = String(html || '');

	output = output.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/gi, (match, before, href, after) => {
		if (/\btarget=/.test(before) || /\btarget=/.test(after)) {
			return match;
		}

		return `<a ${before}href="${href}" target="_blank" rel="noopener noreferrer"${after}>`;
	});

	output = output.replace(/<pre><code\s+class="language-([^"]+)">/gi, (_match, lang) => {
		const safeLang = String(lang || '').trim().toLowerCase();

		return `<pre data-lang="${safeLang}"><span class="md-code-lang">${safeLang}</span><code class="language-${safeLang}">`;
	});

	return output;
}

async function getRenderer() {
	if (cachedRenderer) {
		return cachedRenderer;
	}

	const { marked } = await import('marked');

	marked.setOptions({
		gfm: true,
		breaks: false,
		headerIds: false,
		mangle: false
	});

	cachedRenderer = (source) => postProcess(marked.parse(String(source)));

	return cachedRenderer;
}

export async function renderMarkdown(source) {
	if (!source) {
		return '';
	}

	const render = await getRenderer();

	return render(source);
}
