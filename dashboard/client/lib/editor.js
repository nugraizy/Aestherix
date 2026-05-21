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
		borderLeftColor: 'var(--accent)',
		borderLeftWidth: '0.55em',
		marginLeft: '-0.05em'
	},
	'&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 24%, transparent) !important'
	},
	'& .cm-selectionBackground, & ::selection': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent) !important'
	},
	'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 24%, transparent) !important'
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
	'&.cm-focused.cm-has-selection .cm-activeLine': {
		backgroundColor: 'transparent'
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
	},
	'.cm-panels': {
		position: 'absolute !important',
		top: '8px',
		right: '8px',
		left: 'auto !important',
		bottom: 'auto !important',
		zIndex: '10',
		background: 'rgba(10, 14, 20, 0.75)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(255, 255, 255, 0.12)',
		borderRadius: '10px',
		padding: '0',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
		width: 'auto',
		maxWidth: '360px',
		height: 'auto !important'
	},
	'.cm-search': {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '6px',
		padding: '10px 12px',
		alignItems: 'center'
	},
	'.cm-search label': {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '4px',
		fontSize: '0.75rem',
		color: 'var(--muted)'
	},
	'.cm-search input[type="checkbox"]': {
		accentColor: 'var(--accent)'
	},
	'.cm-searchMatch': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
		borderRadius: '2px'
	},
	'.cm-searchMatch-selected': {
		backgroundColor: 'color-mix(in srgb, var(--accent) 50%, transparent)'
	},
	'.cm-search input, .cm-search button:not(.cm-button)': {
		background: 'rgba(255, 255, 255, 0.06)',
		border: '1px solid rgba(255, 255, 255, 0.15)',
		borderRadius: '6px',
		color: 'var(--text)',
		fontSize: '0.78rem',
		padding: '4px 8px',
		outline: 'none'
	},
	'.cm-search input:focus': {
		borderColor: 'var(--accent)',
		boxShadow: '0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent)'
	},
	'.cm-search button, .cm-button': {
		background: 'rgba(255, 255, 255, 0.08)',
		border: '1px solid rgba(255, 255, 255, 0.15)',
		borderRadius: '6px',
		color: 'var(--text)',
		fontSize: '0.75rem',
		fontWeight: '600',
		padding: '4px 10px',
		cursor: 'pointer'
	},
	'.cm-search button:hover, .cm-button:hover': {
		background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
		borderColor: 'var(--accent)',
		color: 'var(--accent)'
	},
	'.cm-panel.cm-search br': {
		display: 'none'
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

	const selectionTracker = EditorView.updateListener.of((update) => {
		if (!update.selectionSet) {
			return;
		}

		const hasSelection = update.state.selection.ranges.some((r) => !r.empty);

		update.view.dom.classList.toggle('cm-has-selection', hasSelection);
	});

	const extensions = [
		basicSetup,
		keymap.of([indentWithTab]),
		baseTheme,
		syntaxHighlighting(accentHighlight),
		languageCompartment.of(language ? [language] : []),
		updateListener,
		selectionTracker
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
