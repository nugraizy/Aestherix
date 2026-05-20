<script>

	import SkeletonList from '../components/ui/SkeletonList.svelte';
	import Toggle from '../components/ui/Toggle.svelte';
	import Tooltip from '../components/ui/Tooltip.svelte';
	import { get, getGroupInfo, getGroupSettings, getGroups, groupParticipantAction, post, updateGroupSetting } from '../lib/api.js';
	import { showConfirm } from '../lib/confirm.js';
	import { showError, showSuccess } from '../lib/toast.js';

	export let active = true;
	let wasActive = false;

	let groups = [];
	let loading = true;
	let search = '';
	let selectedJid = null;
	let selectedSettings = null;
	let settingsLoading = false;
	let pending = {};
	let groupInfo = null;
	let role = null;
	let loginPhone = '';
	let loginLoading = false;
	let loginStep = 'phone';
	let requestId = '';
	let requestKey = '';
	let statusLabel = '';
	let inlineError = '';
	let cancelWatch = null;

	$: filtered = groups.filter((g) => {
		if (!search) {
			return true;
		}
		const term = search.toLowerCase();

		return g.subject?.toLowerCase().includes(term) || g.jid?.toLowerCase().includes(term);
	});

	$: if (active && !wasActive) {
		wasActive = true;
		void loadGroups();
	}

	$: if (!active && wasActive) {
		wasActive = false;
	}

	async function loadGroups() {
		loading = true;

		try {
			const session = await get('/auth/session');

			role = session?.role || 'viewer';

			if (role === 'owner' || role === 'superOwner') {
				const data = await getGroups();
				groups = data?.groups || [];
			} else if (role === 'groupAdmin') {
				const data = await get('/groups/mine');
				groups = data?.groups || [];
			}
		} catch (error) {
			showError(error?.message || 'Failed to load groups.');
		}

		loading = false;
	}

	async function loginAsGroupAdmin() {
		if (!loginPhone.trim() || loginLoading) {
			return;
		}

		loginLoading = true;
		inlineError = '';

		try {
			const data = await post('/auth/group-admin-login', { phoneNumber: loginPhone.trim() });

			requestId = data.requestId;
			requestKey = data.requestKey;
			loginStep = 'waiting';
			statusLabel = 'Check your WhatsApp for a confirmation message...';
			startWatch();
		} catch (error) {
			inlineError = error?.message || 'Failed. Make sure you are an admin of a bot group.';
			showError(inlineError);
		}

		loginLoading = false;
	}

	function startWatch() {
		if (cancelWatch) {
			cancelWatch();
		}

		cancelWatch = watchConfirmation({
			phoneNumber: loginPhone.trim(),
			requestId,
			requestKey,
			onStatus(status) {
				if (status === 'approved') {
					statusLabel = 'Approved — loading your groups...';
					finalizeLogin();
				} else if (status === 'rejected') {
					statusLabel = '';
					inlineError = 'Login rejected.';
					loginStep = 'phone';
				}
			},
			onError(message) {
				inlineError = message;
				statusLabel = '';
				loginStep = 'phone';
			}
		});
	}

	async function finalizeLogin() {
		try {
			await post('/auth/group-admin-finalize', { requestId, requestKey });

			role = 'groupAdmin';

			const data = await get('/groups/mine');

			groups = data?.groups || [];
			showSuccess(`Logged in as group manager. ${groups.length} group(s) found.`);
		} catch (error) {
			inlineError = error?.message || 'Login failed.';
			loginStep = 'phone';
		}
	}

	async function selectGroup(jid) {
		if (selectedJid === jid) {
			selectedJid = null;
			selectedSettings = null;
			groupInfo = null;
			return;
		}

		selectedJid = jid;
		selectedSettings = null;
		groupInfo = null;
		settingsLoading = true;

		try {
			const [settingsData, infoData] = await Promise.all([
				getGroupSettings(jid).catch(() => null),
				getGroupInfo(jid).catch(() => null)
			]);

			selectedSettings = settingsData?.settings || null;
			groupInfo = infoData;
		} catch {
			selectedSettings = null;
			groupInfo = null;
		}

		settingsLoading = false;
	}

	async function toggleSetting(field, current) {
		if (!selectedJid) {
			return;
		}

		const key = `${selectedJid}:${field}`;

		if (pending[key]) {
			return;
		}

		pending = { ...pending, [key]: true };

		const next = !current;

		try {
			await updateGroupSetting(selectedJid, field, next);

			if (selectedSettings) {
				selectedSettings = { ...selectedSettings, [field]: next };
			}

			showSuccess(`${field} ${next ? 'enabled' : 'disabled'}.`);
		} catch (error) {
			showError(error?.message || `Failed to update ${field}.`);
		}

		const copy = { ...pending };

		delete copy[key];
		pending = copy;
	}

	async function handleParticipantAction(participantId, action) {
		const label = action === 'remove' ? 'kick' : action;
		const ok = await showConfirm({
			title: `${label.charAt(0).toUpperCase() + label.slice(1)} participant`,
			message: `Are you sure you want to ${label} this participant?`,
			confirmLabel: label.charAt(0).toUpperCase() + label.slice(1),
			danger: action === 'remove'
		});

		if (!ok) {
			return;
		}

		try {
			await groupParticipantAction(selectedJid, action, [participantId]);
			showSuccess(`Participant ${label}d.`);

			groupInfo = await getGroupInfo(selectedJid).catch(() => groupInfo);
		} catch (error) {
			showError(error?.message || `Failed to ${label}.`);
		}
	}

	async function saveMessage(field) {
		if (!selectedJid || !selectedSettings) {
			return;
		}

		const key = `${selectedJid}:${field}`;

		if (pending[key]) {
			return;
		}

		pending = { ...pending, [key]: true };

		try {
			await updateGroupSetting(selectedJid, field, selectedSettings[field]);
			showSuccess(`${field} updated.`);
		} catch (error) {
			showError(error?.message || `Failed to update ${field}.`);
		}

		const copy = { ...pending };

		delete copy[key];
		pending = copy;
	}

	const TOGGLE_LABELS = {
		welcome: 'Welcome message',
		leave: 'Leave message',
		welcomeImage: 'Welcome/leave image card',
		antiDelete: 'Anti-delete',
		antiGroupURL: 'Anti group URL',
		antiURL: 'Anti URL',
		antiSpam: 'Anti spam',
		antiVirus: 'Anti virus',
		autoReader: 'Auto read',
		antiNSFW: 'Anti NSFW',
		games: 'Games',
		notification: 'Notification'
	};

	const MESSAGE_LABELS = {
		welcomeMessage: 'Welcome template',
		leaveMessage: 'Leave template'
	};
</script>

<div class="groups-page">
	<header class="page-head">
		<h2>Groups</h2>
		<p class="page-sub">View and manage per-group settings.</p>
	</header>

	{#if loading}
		<div class="layout">
			<section class="section group-list">
				<header class="section-head">
					<h3 class="section-title">Groups <span class="section-count">—</span></h3>
					<input class="input" type="text" placeholder="Search groups..." disabled />
				</header>
				<SkeletonList rows={10} rowHeight="2.8rem" />
			</section>
			<section class="section group-detail">
				<header class="section-head">
					<h3 class="section-title">Group Settings</h3>
				</header>
				<SkeletonList rows={6} rowHeight="2rem" />
			</section>
		</div>
	{:else if role === 'viewer'}
		<div class="group-admin-prompt">
			<div class="prompt-card">
				<span class="prompt-icon">👥</span>
				<h3>Group Manager</h3>
				<p>Are you an admin of a group that has this bot? You can manage your group settings here. A confirmation will be sent to your WhatsApp.</p>

				{#if loginStep === 'phone'}
					<div class="prompt-row">
						<input
							class="input prompt-input"
							type="text"
							placeholder="Your phone number (e.g. 628...)"
							bind:value={loginPhone}
							on:keydown={(e) => e.key === 'Enter' && loginAsGroupAdmin()}
						/>
						<button class="btn primary" type="button" disabled={loginLoading || !loginPhone.trim()} on:click={loginAsGroupAdmin}>
							{loginLoading ? 'Checking...' : 'Continue'}
						</button>
					</div>
				{:else if loginStep === 'waiting'}
					<div class="waiting-state">
						<div class="spinner"></div>
						<span class="waiting-text">{statusLabel}</span>
					</div>
				{/if}

				{#if inlineError}
					<p class="inline-error">{inlineError}</p>
				{/if}
			</div>
		</div>
	{:else}
	<div class="layout">
		<section class="section group-list">
			<header class="section-head">
				<h3 class="section-title">Groups <span class="section-count">{groups.length}</span></h3>
				<input class="input" type="text" placeholder="Search groups..." bind:value={search} />
			</header>
			<div class="section-body list">
				{#if !filtered.length}
					<p class="empty">{search ? `No groups found for '${search}'.` : 'No groups found.'}</p>
				{:else}
					{#each filtered as group (group.jid)}
						<button
							type="button"
							class="group-row"
							class:active={selectedJid === group.jid}
							on:click={() => selectGroup(group.jid)}
						>
							<span class="group-name">{group.subject || group.jid}</span>
							{#if group.size}
								<Tooltip text="Members" placement="left">
									<span class="group-size">{group.size}</span>
								</Tooltip>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</section>

		<section class="section group-detail">
			<header class="section-head">
				<h3 class="section-title">
					{#if selectedJid}
						Settings
					{:else}
						Select a group
					{/if}
				</h3>
			</header>
			<div class="section-body detail-body">
				{#if !selectedJid}
					<p class="empty">Select a group from the list to view its settings.</p>
				{:else if settingsLoading}
					<p class="empty">Loading settings...</p>
				{:else if !selectedSettings}
					<p class="empty">No settings found for this group.</p>
				{:else}
					<div class="settings-grid">
						<div class="settings-section">
							<h4>Toggles</h4>
							<div class="toggles">
								{#each Object.entries(TOGGLE_LABELS) as [field, label] (field)}
									<div class="toggle-row">
										<span class="toggle-label">{label}</span>
										<Toggle
											checked={Boolean(selectedSettings[field])}
											disabled={Boolean(pending[`${selectedJid}:${field}`])}
											label={label}
											size="sm"
											on:change={() => toggleSetting(field, selectedSettings[field])}
										/>
									</div>
								{/each}
							</div>
						</div>

						<div class="settings-section">
							<h4>Message templates</h4>
							<div class="messages">
								{#each Object.entries(MESSAGE_LABELS) as [field, label] (field)}
									<div class="msg-field">
										<span class="msg-label">{label}</span>
										<div class="msg-row">
											<input
												class="input msg-input"
												type="text"
												bind:value={selectedSettings[field]}
												placeholder="{label}..."
											/>
											<button
												class="btn primary"
												type="button"
												disabled={Boolean(pending[`${selectedJid}:${field}`])}
												on:click={() => saveMessage(field)}
											>
												Save
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>

						{#if selectedSettings.bannedMembers?.length}
							<div class="settings-section">
								<h4>Banned members ({selectedSettings.bannedMembers.length})</h4>
								<div class="banned-list">
									{#each selectedSettings.bannedMembers as member (member)}
										<span class="banned-chip">{member}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</section>
	</div>

	{#if groupInfo}
		<section class="section participants-panel">
			<header class="section-head">
				<h3 class="section-title">
					{groupInfo.subject || 'Group Info'}
					<span class="section-count">{groupInfo.size} members</span>
				</h3>
			</header>
			<div class="section-body">
				{#if groupInfo.desc}
					<p class="group-desc">{groupInfo.desc}</p>
				{/if}
				<div class="participants-list">
					{#each groupInfo.participants as p (p.id)}
						<div class="participant-row">
							<span class="p-name">
								<span class="p-phone">{p.phone || p.id.split('@')[0]}</span>
								{#if p.name}
									<span class="p-pushname">({p.name})</span>
								{/if}
								{#if p.isBot || p.isBotOwner || p.isGroupOwner || p.admin || (!p.admin && !p.isGroupOwner && !p.isBotOwner)}
									<span class="p-role">
										{#if p.isBot}<span class="role-bot">Bot</span><span class="role-divider" aria-hidden="true">|</span>{/if}
										{#if p.isBotOwner}<span class="role-owner">Bot Owner</span><span class="role-divider" aria-hidden="true">|</span>{/if}
										{#if p.isGroupOwner}<span class="role-owner">Group Owner</span><span class="role-divider" aria-hidden="true">|</span>{/if}
										{#if p.admin === 'admin' || (p.isBotOwner && p.admin)}<span class="role-admin">Admin</span>{/if}
										{#if !p.admin && !p.isGroupOwner && !p.isBotOwner}<span class="role-member">Member</span>{/if}
									</span>
								{/if}
							</span>
							{#if groupInfo.isBotAdmin && !p.isGroupOwner && !p.isBotOwner}
								<div class="p-actions">
									{#if p.admin}
										<span class="action-btn"><span class="action-demote" role="button" tabindex="0" on:click={() => handleParticipantAction(p.id, 'demote')} on:keydown={(e) => e.key === 'Enter' && handleParticipantAction(p.id, 'demote')}>Demote</span><span class="action-divider-v" aria-hidden="true">|</span><span class="action-kick" role="button" tabindex="0" on:click={() => handleParticipantAction(p.id, 'remove')} on:keydown={(e) => e.key === 'Enter' && handleParticipantAction(p.id, 'remove')}>Kick</span></span>
									{:else}
										<span class="action-btn"><span class="action-promote" role="button" tabindex="0" on:click={() => handleParticipantAction(p.id, 'promote')} on:keydown={(e) => e.key === 'Enter' && handleParticipantAction(p.id, 'promote')}>Promote</span><span class="action-divider-v" aria-hidden="true">|</span><span class="action-kick" role="button" tabindex="0" on:click={() => handleParticipantAction(p.id, 'remove')} on:keydown={(e) => e.key === 'Enter' && handleParticipantAction(p.id, 'remove')}>Kick</span></span>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	{/if}
</div>

<style>
	.groups-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.page-head {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.page-head h2 {
		margin: 0;
		font-size: var(--fs-xl);
		letter-spacing: -0.01em;
	}

	.page-sub {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.group-admin-prompt {
		display: grid;
		place-items: center;
		min-height: 40vh;
	}

	.prompt-card {
		max-width: 500px;
		padding: var(--space-5);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.prompt-card h3 {
		margin: 0;
		font-size: var(--fs-lg);
	}

	.prompt-card p {
		margin: 0;
		color: var(--muted);
		font-size: var(--fs-sm);
		line-height: 1.5;
	}

	.prompt-row {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.prompt-input {
		flex: 1;
		min-width: 180px;
		max-width: none;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.prompt-icon {
		font-size: 2.5rem;
	}

	.waiting-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-3);
	}

	.waiting-state .spinner {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--accent) 24%, transparent);
		border-top-color: var(--accent);
		animation: spin 0.9s linear infinite;
	}

	.waiting-text {
		font-size: var(--fs-sm);
		color: var(--muted);
	}

	.inline-error {
		margin: 0;
		color: #ff8e74;
		font-size: var(--fs-sm);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr 1.6fr;
		gap: var(--space-4);
		align-items: stretch;
		height: clamp(480px, 72vh, 800px);
	}

	.layout > :global(*) {
		min-height: 0;
		height: 100%;
	}

	.list {
		overflow-y: auto;
	}

	.group-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		width: 100%;
		padding: 0.5rem 0.6rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text);
		font-size: var(--fs-sm);
		text-align: left;
		cursor: pointer;
		transition: background var(--tx-base);
	}

	.group-row:hover {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.group-row.active {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--accent);
	}

	.group-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.group-size {
		font-size: var(--fs-xs);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.detail-body {
		overflow-y: auto;
	}

	.settings-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.settings-section h4 {
		margin: 0 0 var(--space-2);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent);
		font-weight: 700;
	}

	.toggles {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-sm);
		transition: background var(--tx-base);
	}

	.toggle-row:hover {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.toggle-label {
		font-size: var(--fs-sm);
		color: var(--text);
	}

	.messages {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.msg-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.msg-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.msg-row {
		display: flex;
		gap: 0.5rem;
	}

	.msg-input {
		flex: 1;
	}

	.banned-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.banned-chip {
		font-size: var(--fs-xs);
		padding: 0.18rem 0.55rem;
		border-radius: var(--radius-pill);
		border: 1px solid rgba(255, 142, 116, 0.4);
		background: rgba(255, 142, 116, 0.12);
		color: #ff8e74;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.input {
		max-width: 220px;
	}

	.participants-panel {
		margin-top: var(--space-4);
	}

	.group-desc {
		margin: 0 0 var(--space-3);
		color: var(--muted);
		font-size: var(--fs-sm);
		line-height: 1.5;
		white-space: pre-line;
	}

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.participant-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-sm);
		transition: background var(--tx-base);
	}

	.participant-row:hover {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.p-name {
		flex: 1;
		font-size: var(--fs-sm);
		color: var(--text);
		min-width: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.p-phone {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-sm);
	}

	.p-pushname {
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.p-role {
		font-size: var(--fs-xs);
		padding: 0.12rem 0.5rem;
		border-radius: var(--radius-pill);
		background: var(--border);
		color: var(--muted);
		white-space: nowrap;
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.role-bot {
		color: var(--accent);
	}

	.role-admin {
		color: var(--accent);
	}

	.role-owner {
		color: #f0c887;
	}

	.role-member {
		color: var(--muted);
	}

	.role-divider {
		font-size: var(--fs-xs);
		padding: 0 0.1rem;
		opacity: 0.35;
	}

	.p-actions {
		display: inline-flex;
		gap: 0.3rem;
	}

	.action-btn {
		font-size: var(--fs-xs);
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-pill);
		border: 1px solid var(--border);
		background: transparent;
		white-space: nowrap;
		cursor: pointer;
		transition: border-color var(--tx-base);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-btn:hover {
		border-color: var(--border);
	}

	.action-divider-v {
		font-size: var(--fs-xs);
		opacity: 0.35;
	}

	.action-promote,
	.action-demote {
		color: var(--accent);
		cursor: pointer;
		transition: all var(--tx-base);
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
	}

	.action-promote:hover,
	.action-demote:hover {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: color-mix(in srgb, var(--accent) 80%, white);
	}

	.action-kick {
		color: #ff8e74;
		cursor: pointer;
		transition: all var(--tx-base);
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
	}

	.action-kick:hover {
		background: rgba(255, 142, 116, 0.18);
		color: color-mix(in srgb, #ff8e74 80%, white);
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
			height: auto;
		}

		.layout > :global(*) {
			height: clamp(360px, 50vh, 560px);
		}

		.input {
			max-width: 100%;
		}
	}
</style>
