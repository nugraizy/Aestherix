import { randomize, readJSON } from '../../modules/functions.js';

export const scheme = () => randomize(readJSON('./helper/misc/palettes/palettes.json'));
