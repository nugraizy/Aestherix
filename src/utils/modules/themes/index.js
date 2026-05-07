import { theme as catppuccinTheme } from './color.catppuccin.js';
import { theme as cyberpunkTheme } from './color.cyberpunk.js';
import { theme as draculaTheme } from './color.dracula.js';
import { theme as synthwaveTheme } from './color.synthwave.js';

export const THEMES = Object.assign({
	dracula: draculaTheme.dracula,
	cyberpunk2077: cyberpunkTheme.cyberpunk2077,
	synthwave: synthwaveTheme.synthwave,
	catppuccin: catppuccinTheme.catppuccin
});
