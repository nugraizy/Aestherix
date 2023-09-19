import fs from 'fs-extra';

import { randomize } from '../../../utils/modules/index.js';

const userAgents = await fs.readJSON('./src/helper/misc/user_agent/ua.json');

/**
 * Randomize User-Agent.
 * @returns {string}
 */
export const UA = () => randomize(userAgents);
