import { ReassignResult } from '../helper';
import { SingleAuthState } from '../helper/connection/type';

export interface Plugins {
	name: string;
	description: number;
	category: string;
	usage: string;
	aliases: string[];
	cooldown: number;
	limit: number;
	status: 'enable' | 'disable';
	run: (ctx: ReassignResult & { state: SingleAuthState['state'] }, client: (typeof globalThis)['client']) => unknown;
}
