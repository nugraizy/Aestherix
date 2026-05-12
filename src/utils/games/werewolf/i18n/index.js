/**
 * Werewolf i18n — registers the Indonesian + English tables into the
 * project-wide helper. Import this file once to make the strings
 * available via `t('id', 'werewolf.errors.notRoomMaster')`.
 */

import { registerNamespace } from '../../../../helper/i18n/index.js';
import idTable from './id.js';
import enTable from './en.js';

export const WEREWOLF_NAMESPACE = 'werewolf';

registerNamespace(WEREWOLF_NAMESPACE, 'id', idTable);
registerNamespace(WEREWOLF_NAMESPACE, 'en', enTable);

export { idTable, enTable };
