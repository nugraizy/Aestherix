<script>
	import { onMount } from 'svelte';

	import { exportSettings, getSettings, importSettings, updateSettings } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { maintenanceMode } from '../lib/stores.js';
	import { showError, showSuccess, showUndoToast } from '../lib/toast.js';
	import Dropdown from './ui/Dropdown.svelte';
	import NumberInput from './ui/NumberInput.svelte';
	import TagInput from './ui/TagInput.svelte';
	import Toggle from './ui/Toggle.svelte';
	import SkeletonList from './ui/SkeletonList.svelte';

	export let isViewer = false;

	const HOST_FIELD_KEYS = new Set(['main_host_number', 'owner_number', 'backups_host_numbers', 'team_number']);

	const THEME_OPTIONS = [
		{ value: 'dracula', label: 'Dracula' },
		{ value: 'cyberpunk2077', label: 'Cyberpunk 2077' },
		{ value: 'synthwave', label: 'Synthwave' },
		{ value: 'catppuccin', label: 'Catppuccin' }
	];

	let original = null;
	let form = null;
	let loading = true;
	let saving = false;
	let error = '';

	onMount(reload);

	async function reload() {
		loading = true;
		error = '';

		try {
			const data = await getSettings();

			original = normalize(data?.settings || {});
			form = { ...original };
			maintenanceMode.set(Boolean(original.maintenance));
		} catch (err) {
			error = err?.message || 'Failed to load settings.';
			showError(error);
		}

		loading = false;
	}

	function normalize(data) {
		return {
			maintenance: Boolean(data.maintenance),
			main_session: String(data.main_session || ''),
			logger_theme: String(data.logger_theme || 'dracula'),
			limit: Number(data.limit ?? 0),
			max_group: Number(data.max_group ?? 0),
			min_members: Number(data.min_members ?? 0),
			packname: String(data.packname || ''),
			author: String(data.author || ''),
			main_host_number: String(data.main_host_number || ''),
			backups_host_numbers: Array.isArray(data.backups_host_numbers)
				? data.backups_host_numbers.map(normalizePhone).filter(Boolean)
				: [],
			owner_number: String(data.owner_number || ''),
			team_number: Array.isArray(data.team_number)
				? data.team_number.map(normalizePhone).filter(Boolean)
				: []
		};
	}

	function normalizePhone(value) {
		return String(value || '')
			.trim()
			.split('@')[0]
			.replace(/\D/g, '');
	}

	function isValidPhone(value) {
		return /^\d{6,20}$/.test(value);
	}

	$: dirty = form && original && JSON.stringify(form) !== JSON.stringify(original);
	$: changedKeys = computeChangedKeys(form, original);

	function computeChangedKeys(next, prev) {
		if (!next || !prev) {
			return [];
		}

		const keys = [];

		for (const key of Object.keys(next)) {
			const a = next[key];
			const b = prev[key];

			if (Array.isArray(a) || Array.isArray(b)) {
				if (!arraysEqual(a, b)) {
					keys.push(key);
				}

				continue;
			}

			if (a !== b) {
				keys.push(key);
			}
		}

		return keys;
	}

	function buildPatch() {
		if (!form || !original) {
			return {};
		}

		const patch = {};
		const scalars = ['main_session', 'logger_theme', 'packname', 'author', 'main_host_number', 'owner_number'];
		const numbers = ['limit', 'max_group', 'min_members'];

		for (const key of scalars) {
			if (form[key] !== original[key]) {
				patch[key] = form[key];
			}
		}

		for (const key of numbers) {
			if (Number(form[key]) !== Number(original[key])) {
				patch[key] = Number(form[key]);
			}
		}

		if (form.maintenance !== original.maintenance) {
			patch.maintenance = Boolean(form.maintenance);
		}

		if (!arraysEqual(form.backups_host_numbers, original.backups_host_numbers)) {
			patch.backups_host_numbers = [...form.backups_host_numbers];
		}

		if (!arraysEqual(form.team_number, original.team_number)) {
			patch.team_number = [...form.team_number];
		}

		return patch;
	}

	function arraysEqual(a, b) {
		if (!Array.isArray(a) || !Array.isArray(b)) {
			return a === b;
		}

		if (a.length !== b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) {
				return false;
			}
		}

		return true;
	}

	function patchTouchesHosts(patch) {
		for (const key of Object.keys(patch)) {
			if (HOST_FIELD_KEYS.has(key)) {
				return true;
			}
		}

		return false;
	}

	async function save() {
		if (!dirty || saving || isViewer) {
			return;
		}

		const patch = buildPatch();

		if (Object.keys(patch).length === 0) {
			return;
		}

		if (patchTouchesHosts(patch)) {
			const ok = await showConfirm({
				title: 'Update host numbers',
				message:
					'Changing owner / team / host numbers can lock you out of the bot if a value is wrong. Confirm to apply.',
				confirmLabel: 'Apply',
				danger: true
			});

			if (!ok) {
				return;
			}
		}

		saving = true;

		try {
			const result = await updateSettings(patch);

			original = normalize(result?.settings || {});
			form = { ...original };
			maintenanceMode.set(Boolean(original.maintenance));

			if (result?.undo?.token) {
				showUndoToast({
					message: `Settings updated (${Object.keys(patch).length} field${Object.keys(patch).length === 1 ? '' : 's'}).`,
					undo: result.undo,
					onAfterUndo: reload
				});
			} else {
				showSuccess('Settings updated.');
			}
		} catch (err) {
			showError(err?.message || 'Failed to update settings.');
		}

		saving = false;
	}

	function discard() {
		if (!original || saving) {
			return;
		}

		form = { ...original };
	}

	let importInput;

	function handleImportClick() {
		importInput?.click();
	}

	async function handleImportFile(event) {
		const file = event.target?.files?.[0];

		if (!file) {
			return;
		}

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			const ok = await showConfirm({
				title: 'Import settings',
				message: 'This will overwrite current settings with the imported file. Continue?',
				confirmLabel: 'Import',
				danger: true
			});

			if (!ok) {
				return;
			}

			await importSettings(data);
			showSuccess('Settings imported.');
			await reload();
		} catch (error) {
			showError(error?.message || 'Failed to import settings.');
		}

		if (importInput) {
			importInput.value = '';
		}
	}
</script>

<section class="section settings-form">
	<header class="section-head">
		<h3 class="section-title">Settings</h3>
		<div class="head-actions">
			<button class="btn" type="button" on:click={exportSettings}>Export</button>
			<button class="btn" type="button" on:click={handleImportClick}>Import</button>
			<input bind:this={importInput} type="file" accept=".json" class="hidden" on:change={handleImportFile} />
			<button class="btn" type="button" on:click={discard} disabled={!dirty || saving || isViewer}>
				Discard
			</button>
			<button class="btn primary" type="button" on:click={save} disabled={!dirty || saving || isViewer}>
				{saving ? 'Saving...' : dirty ? `Save (${changedKeys.length})` : 'Save'}
			</button>
		</div>
	</header>

	<div class="body">
		{#if loading}
			<SkeletonList rows={8} rowHeight="2.2rem" />
		{:else if error}
			<p class="empty error">{error}</p>
		{:else if form}
			<div class="group">
				<h4>General</h4>
				<div class="grid">
					<div class="field row">
						<span class="label">Maintenance mode</span>
						<Toggle
							checked={form.maintenance}
							readonly={isViewer}
							label="Maintenance mode — non-owners get a maintenance reply"
							on:change={(event) => (form.maintenance = event.detail)}
						/>
					</div>

					<label class="field">
						<span class="label">
							Main session
							<span class="restart-tag" title="Takes effect after a bot restart">restart</span>
						</span>
						<input class="input" type="text" bind:value={form.main_session} disabled={isViewer} />
					</label>

					<div class="field">
						<span class="label">Logger theme</span>
						<Dropdown
							value={form.logger_theme}
							options={THEME_OPTIONS}
							on:change={(event) => (form.logger_theme = event.detail)}
						/>
					</div>
				</div>
			</div>

			<div class="group">
				<h4>Limits</h4>
				<div class="grid">
					<div class="field">
						<span class="label">
							Default user limit
							<span class="restart-tag" title="Takes effect after a bot restart">restart</span>
						</span>
						<NumberInput
							bind:value={form.limit}
							min={0}
							disabled={isViewer}
						/>
					</div>

					<div class="field">
						<span class="label">Max groups (join)</span>
						<NumberInput
							bind:value={form.max_group}
							min={1}
							disabled={isViewer}
						/>
					</div>

					<div class="field">
						<span class="label">Min members (join)</span>
						<NumberInput
							bind:value={form.min_members}
							min={1}
							disabled={isViewer}
						/>
					</div>
				</div>
			</div>

			<div class="group">
				<h4>Branding</h4>
				<div class="grid">
					<label class="field grow">
						<span class="label">Packname</span>
						<input class="input" type="text" bind:value={form.packname} disabled={isViewer} />
					</label>
					<label class="field grow">
						<span class="label">Author</span>
						<input class="input" type="text" bind:value={form.author} disabled={isViewer} />
					</label>
				</div>
			</div>

			<div class="group restricted">
				<h4>
					Hosts
					<span class="badge">restricted</span>
				</h4>
				<p class="hint">Phone numbers must be digits only (without <code>@s.whatsapp.net</code>).</p>
				<div class="grid hosts-grid">
					<label class="field">
						<span class="label">
							Main host number
							<span class="restart-tag" title="Takes effect on next pairing">restart</span>
						</span>
						<input
							class="input"
							type="text"
							bind:value={form.main_host_number}
							placeholder="6281234567890"
							disabled={isViewer}
						/>
					</label>

					<label class="field">
						<span class="label">Owner number</span>
						<input
							class="input"
							type="text"
							bind:value={form.owner_number}
							placeholder="6281234567890"
							disabled={isViewer}
						/>
					</label>

					<div class="field grow">
						<span class="label">
							Backup host numbers
							<span class="restart-tag" title="Takes effect on next pairing">restart</span>
						</span>
						<TagInput
							tags={form.backups_host_numbers}
							placeholder="Type a number, press Enter..."
							disabled={isViewer}
							normalizer={normalizePhone}
							validator={isValidPhone}
							on:change={(event) => (form.backups_host_numbers = event.detail)}
						/>
					</div>

					<div class="field grow">
						<span class="label">Team numbers</span>
						<TagInput
							tags={form.team_number}
							placeholder="Type a number, press Enter..."
							disabled={isViewer}
							normalizer={normalizePhone}
							validator={isValidPhone}
							on:change={(event) => (form.team_number = event.detail)}
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.body {
		padding: var(--space-3) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.head-actions {
		display: inline-flex;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.hidden {
		display: none;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}

	.group:first-child {
		border-top: none;
		padding-top: 0;
	}

	.group h4 {
		margin: 0;
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent);
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		font-size: var(--fs-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.1rem 0.5rem;
		border-radius: var(--radius-pill);
		background: rgba(255, 142, 116, 0.18);
		color: #ff8e74;
	}

	.group.restricted {
		padding: var(--space-3);
		border: 1px solid color-mix(in srgb, #ff8e74 35%, var(--border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, #ff8e74 6%, var(--panel));
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-3);
	}

	.hosts-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.field.grow {
		grid-column: span 2;
	}

	.field.row {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.restart-tag {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.05rem 0.4rem;
		border-radius: var(--radius-pill);
		background: rgba(240, 200, 135, 0.18);
		color: #f0c887;
		cursor: help;
	}

	.hint {
		font-size: var(--fs-xs);
		color: var(--muted);
		margin: 0;
	}

	.hint code {
		background: color-mix(in srgb, var(--accent) 14%, var(--bg));
		padding: 0 4px;
		border-radius: 3px;
		font-size: 0.95em;
	}

	.empty.error {
		color: #ff8e74;
	}

	@media (max-width: 720px) {
		.field.grow {
			grid-column: span 1;
		}

		.hosts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
