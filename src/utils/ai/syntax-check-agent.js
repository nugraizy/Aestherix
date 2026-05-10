import { ChatGPTDialogue } from './char-ai.js';

const SYNTAX_CHECKER_ROLE = [
	'You are a senior JavaScript/Node.js code review engineer.',
	'Your job is to analyze syntax errors and provide a short, actionable fix suggestion.',
	'Respond in 1-3 sentences max. Be direct and concise.',
	'REMEMBER, USE BACKTICK OR CODEBLOCK IF GIVING CODE',
	'Do not greet or introduce yourself.',
	'Only explain what caused the error and how to fix it.',
	'If the error is obvious (missing bracket, typo), say so directly.',
	'Reply should be in the language user ask. If no language provided then use english. User either put language code or the complete language name.'
];

const agent = new ChatGPTDialogue(null, null, null, {
	mode: 'agent',
	rolePrompts: SYNTAX_CHECKER_ROLE
});

/**
 * @param {{ filename: string, error: string, line: number, column: number, code: string, language: string }} context
 * @returns {Promise<string>}
 */
export const getSyntaxAdvice = async ({ filename, error, line, column, code, language }) => {
	try {
		const prompt = `File: ${filename}\nUser wants reply in ${language}. Error at line ${line}, column ${column}: ${error}\n\nCode around the error:\n\`\`\`js\n${code}\n\`\`\`\n\nWhat caused this and how to fix it?`;
		const result = await agent.sendMessage(prompt);

		return result?.error ? '' : result?.message || '';
	} catch {
		return '';
	}
};
