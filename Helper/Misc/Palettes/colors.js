import { randomize, readJSON } from '../../Modules/functions.js';

export const scheme = () => randomize(readJSON('./Helper/Misc/Palettes/palettes.json'));
