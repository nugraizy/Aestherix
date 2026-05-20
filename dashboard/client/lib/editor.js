import { basicSetup, EditorView } from 'codemirror';
import { Compartment, EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

import { css as cssLang } from '@codemirror/lang-css';
import { html as htmlLang } from '@codemirror/lang-html';
import { javascript as jsLang } from '@codemirror/lang-javascript';
import { json as jsonLang } from '@codemirror/lang-json';
import { markdown as mdLang } from '@codemirror/lang-markdown';

const LANG_BY_EXT = {
	js: () => jsLang(),
	mjs: () => jsLang(),
	cjs: () => jsLang(),
	jsx: () => jsLang({ jsx: true }),
	ts: () => jsLang({ typescript: true }),
	tsx: () => jsLang({ typescript: true, jsx: true }),
	json: () => jsonLang(),
	html: () => htmlLang(),
	htm: () => htmlLang(),
	svelte: () => htmlLang(),
	css: () => cssLang(),
	scss: () => cssLang(),
	md: () => mdLang(),
	markdown: () => mdLang()
};

export function detectLanguage(path) {
	if (!path) {
		return null;
	}

	const idx = path.lastIndexOf('.');

	if (idx < 0) {
		return null;
	}

	const ext = path.slice(idx + 1).toLowerCase();
	const factory = LANG_BY_EXT[ext];

	return factory ? factory() : null;
}

const baseTheme = EditorView.theme({
	'&': {
		height: '100%',
		fontSize: '0.85rem',
		fontFamily: '\'JetBrains Mono\', \'Fira Code\', ui-monospace, monospace',
		backgroundColor: 'transparent',
		color: 'var(--text)'
	},
	'.cm-scroller': {
		fontFamily: 'inherit',
		lineHeight: '1.55'
	},
	'.cm-content': {
		caretColor: 'var(--accent)',
		padding: '12px 0'
	},
	'.cm-cursor, .cm-dropCursor': {
		borderLeftColor: 'var(--accent)'
	},
	'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 24%, transparent)'
	},
	'.cm-gutters': {
		backgroundColor: 'transparent',
		color: 'color-mix(in srgb, var(--muted) 80%, transparent)',
		borderRight: '1px solid var(--border)',
		paddingRight: '4px'
	},
	'.cm-activeLine': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)'
	},
	'.cm-activeLineGutter': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
		color: 'var(--accent)'
	},
	'.cm-tooltip, .cm-panels': {
		background: 'var(--panel)',
		color: 'var(--text)',
		border: '1px solid var(--border)'
	},
	'.cm-selectionMatch': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)'
	}
});

const accentHighlight = HighlightStyle.define([
	{ tag: tags.keyword, color: 'var(--code-keyword, #c4b5fd)', fontWeight: '600' },
	{ tag: tags.controlKeyword, color: 'var(--code-keyword, #c4b5fd)' },
	{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: 'var(--code-atom, #f0c887)' },
	{ tag: tags.number, color: 'var(--code-number, #f0c887)' },
	{ tag: [tags.string, tags.special(tags.string)], color: 'var(--code-string, #87f0c1)' },
	{ tag: tags.regexp, color: 'var(--code-string, #87f0c1)' },
	{ tag: tags.escape, color: 'var(--code-escape, #ff8e74)' },
	{ tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--code-function, #8ef0ff)' },
	{ tag: [tags.propertyName, tags.attributeName], color: 'var(--code-property, #c4b5fd)' },
	{ tag: [tags.typeName, tags.className], color: 'var(--code-type, #f0c887)' },
	{ tag: [tags.tagName], color: 'var(--code-tag, #ff8e74)' },
	{ tag: [tags.operator, tags.operatorKeyword], color: 'var(--code-operator, #8ef0ff)' },
	{ tag: tags.punctuation, color: 'var(--muted)' },
	{ tag: tags.bracket, color: 'var(--muted)' },
	{ tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: 'var(--code-comment, #6c7086)', fontStyle: 'italic' },
	{ tag: tags.heading, color: 'var(--accent)', fontWeight: '600' },
	{ tag: tags.link, color: 'var(--code-function, #8ef0ff)', textDecoration: 'underline' },
	{ tag: tags.invalid, color: '#ff8e74', textDecoration: 'underline wavy' }
]);

export function buildEditor({ parent, content = '', language = null, onChange = () => {}, onSave = null }) {
	const languageCompartment = new Compartment();
	let suppressChange = false;
	const updateListener = EditorView.updateListener.of((update) => {
		if (!update.docChanged) {
			return;
		}

		if (suppressChange) {
			return;
		}

		onChange(update.state.doc.toString());
	});

	const saveBinding = onSave
		? keymap.of([
				{
					key: 'Mod-s',
					preventDefault: true,
					run: (view) => {
						onSave(view.state.doc.toString());
						return true;
					}
				}
			])
		: null;

	const extensions = [
		basicSetup,
		keymap.of([indentWithTab]),
		baseTheme,
		syntaxHighlighting(accentHighlight),
		languageCompartment.of(language ? [language] : []),
		updateListener
	];

	if (saveBinding) {
		extensions.push(saveBinding);
	}

	const view = new EditorView({
		parent,
		state: EditorState.create({ doc: content, extensions })
	});

	return {
		view,
		setContent(next) {
			const doc = view.state.doc;

			if (doc.toString() === next) {
				return;
			}

			suppressChange = true;

			try {
				view.dispatch({
					changes: { from: 0, to: doc.length, insert: next }
				});
			} finally {
				suppressChange = false;
			}
		},
		getContent() {
			return view.state.doc.toString();
		},
		setLanguage(nextLang) {
			view.dispatch({
				effects: languageCompartment.reconfigure(nextLang ? [nextLang] : [])
			});
		},
		focus() {
			view.focus();
		},
		destroy() {
			view.destroy();
		}
	};
}
