import fs from 'fs-extra';

import { randomize } from '../../../utils/modules/index.js';

/**
 * Randomize User-Agent.
 * @returns {string}
 */
export const UA = async () => randomize(await fs.readJSON('./src/helper/misc/user_agent/ua.json'));
