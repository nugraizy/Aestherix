import { randomize, readJSON } from '../../modules/functions.js';

/**
 * Randomize Color Palettes.
 * @returns {string}
 */
export const scheme = () => randomize(readJSON('./helper/misc/palettes/palettes.json'));
