import fs from 'fs-extra';

import { randomize } from '../../../utils/modules/index.js';

const colorSceheme = await fs.readJSON('./src/helper/misc/palettes/palettes.json');

/**
 * Randomize Color Palettes.
 * @returns {string}
 */
export const scheme = () => randomize(colorSceheme);
