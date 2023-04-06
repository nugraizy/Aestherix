import fs from 'fs-extra';

import { randomize } from '../../../utils/modules/index.js';

/**
 * Randomize Color Palettes.
 * @returns {string}
 */
export const scheme = async () => randomize(await fs.readJSON('./src/helper/misc/palettes/palettes.json'));
