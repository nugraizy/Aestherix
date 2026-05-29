<script>
	import { onDestroy } from 'svelte';

	import { cancelScheduledBroadcast, deleteBroadcastTemplate, getBroadcastContacts, getBroadcastStatus, getBroadcastTemplates, getGroups, getScheduledBroadcast, saveBroadcastTemplate, scheduleBroadcast, sendBroadcast } from '../lib/api.js';
	import { showConfirm, showPrompt } from '../lib/confirm.js';
	import { showError, showSuccess } from '../lib/toast.js';
	import Dropdown from '../components/ui/Dropdown.svelte';
	import NumberInput from '../components/ui/NumberInput.svelte';
	import Toggle from '../components/ui/Toggle.svelte';
	import Tooltip from '../components/ui/Tooltip.svelte';
	import SkeletonList from '../components/ui/SkeletonList.svelte';

	const BUTTON_TYPE_OPTIONS = [
		{ value: 'reply', label: 'Reply' },
		{ value: 'url', label: 'URL' }
	];

	const MEDIA_TYPE_OPTIONS = [
		{ value: 'image', label: 'Image' },
		{ value: 'video', label: 'Video' },
		{ value: 'document', label: 'Document' },
		{ value: 'audio', label: 'Audio' }
	];

	let groups = [];
	let contacts = [];
	let loading = true;
	let sending = false;
	let message = '';
	let header = 'Broadcast';
	let dryRun = false;
	let mentionAll = false;
	let delayMs = 1500;
	let selected = new Set();
	let lastResult = null;
	let search = '';
	let category = 'groups';
	let buttons = [];
	let mediaUrl = '';
	let mediaType = 'image';
	let mediaFile = null;
	let fileInput;
	let isDragging = false;
	let templates = [];
	let scheduleTime = '';
	let schedules = [];
	let msgTextarea;

	export let active = true;
	let wasActive = false;
	let loaded = false;

	$: if (active && !wasActive) { wasActive = true; if (!loaded) void loadBroadcastData(); }
	$: if (!active && wasActive) { wasActive = false; }

	async function loadBroadcastData() {
		loading = true;
		try {
			const [groupData, contactData, statusData, tplData, schedData] = await Promise.all([
				getGroups(),
				getBroadcastContacts().catch(() => ({ contacts: [] })),
				getBroadcastStatus(),
				getBroadcastTemplates().catch(() => ({ templates: [] })),
				getScheduledBroadcast().catch(() => ({ scheduled: null }))
			]);

			groups = (groupData?.groups || []).map((g) => ({ ...g, type: 'group' }));
			contacts = (contactData?.contacts || []).map((c) => ({ ...c, type: 'contact' }));
			lastResult = statusData?.lastResult || null;
			templates = tplData?.templates || [];
			schedules = schedData?.schedules || [];
			loaded = true;
		} catch (error) {
			showError(error?.message || 'Failed to load data.');
		}
		loading = false;
	}

	$: targets = category === 'groups' ? groups : category === 'contacts' ? contacts : [...groups, ...contacts];
	$: filtered = targets.filter((t) => {
		if (!search) {
			return true;
		}

		const term = search.toLowerCase();
		const name = (t.subject || t.name || '').toLowerCase();
		const id = (t.jid || '').toLowerCase();

		return name.includes(term) || id.includes(term);
	});

	$: activeSchedules = schedules.filter((s) => s.sendAt > now);
	$: selectedCount = selected.size;

	let now = Date.now();

	const nowInterval = setInterval(() => {
		if (!active) {
			return;
		}

		if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
			return;
		}

		now = Date.now();
	}, 5000);
	$: estimatedSeconds = selectedCount > 0 ? Math.ceil((selectedCount - 1) * delayMs / 1000) : 0;
	$: estimatedLabel = estimatedSeconds < 60
		? `~${estimatedSeconds}s`
		: `~${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;

	onDestroy(() => clearInterval(nowInterval));

	function toggleTarget(jid) {
		const next = new Set(selected);

		if (next.has(jid)) {
			next.delete(jid);
		} else {
			if (next.size >= 50) {
				showError('Maximum 50 targets per broadcast.');
				return;
			}

			next.add(jid);
		}

		selected = next;
	}

	function selectAll() {
		selected = new Set(filtered.slice(0, 50).map((t) => t.jid));
	}

	function deselectAll() {
		selected = new Set();
	}

	function addButton() {
		if (buttons.length >= 3) {
			return;
		}

		buttons = [...buttons, { type: 'reply', label: '', url: '', id: '' }];
	}

	function removeButton(index) {
		buttons = buttons.filter((_, i) => i !== index);
	}

	function detectMediaType(file) {
		const mime = String(file?.type || '').toLowerCase();

		if (mime.startsWith('image/')) return 'image';
		if (mime.startsWith('video/')) return 'video';
		if (mime.startsWith('audio/')) return 'audio';

		return 'document';
	}

	function handleDrop(event) {
		isDragging = false;

		const file = event.dataTransfer?.files?.[0];

		if (file) {
			mediaFile = file;
			mediaType = detectMediaType(file);
			mediaUrl = '';
		}
	}

	function handleFileSelect(event) {
		const file = event.target?.files?.[0];

		if (file) {
			mediaFile = file;
			mediaType = detectMediaType(file);
			mediaUrl = '';
		}
	}

	function clearFile() {
		mediaFile = null;

		if (fileInput) {
			fileInput.value = '';
		}
	}

	function wrapSelection(before, after) {
		if (!msgTextarea) {
			return;
		}

		const start = msgTextarea.selectionStart;
		const end = msgTextarea.selectionEnd;
		const selected = message.slice(start, end);

		message = message.slice(0, start) + before + selected + (after || before) + message.slice(end);

		setTimeout(() => {
			msgTextarea.focus();
			msgTextarea.selectionStart = start + before.length;
			msgTextarea.selectionEnd = end + before.length;
		}, 0);
	}

	function insertPlaceholder(placeholder) {
		if (!msgTextarea) {
			message += placeholder;
			return;
		}

		const pos = msgTextarea.selectionStart;

		message = message.slice(0, pos) + placeholder + message.slice(pos);

		setTimeout(() => {
			msgTextarea.focus();
			msgTextarea.selectionStart = pos + placeholder.length;
			msgTextarea.selectionEnd = pos + placeholder.length;
		}, 0);
	}

	async function loadTemplates() {
		try {
			const data = await getBroadcastTemplates();

			templates = data?.templates || [];
		} catch {
			templates = [];
		}
	}

	function applyTemplate(tpl) {
		header = tpl.header || '';
		message = tpl.message || '';
		buttons = tpl.buttons || [];
		mediaUrl = tpl.mediaUrl || '';
		mediaType = tpl.mediaType || 'image';
	}

	async function saveCurrentTemplate() {
		const name = await showPrompt({
			title: 'Save template',
			message: 'Enter a name for this template:',
			confirmLabel: 'Save',
			placeholder: 'My template'
		});

		if (!name?.trim()) {
			return;
		}

		const tpl = { name: name.trim(), header, message, buttons, mediaUrl, mediaType };

		try {
			const result = await saveBroadcastTemplate(tpl);

			templates = result?.templates || templates;
			showSuccess(`Template "${name.trim()}" saved.`);
		} catch (error) {
			showError(error?.message || 'Failed to save template.');
		}
	}

	async function removeTemplate(name) {
		try {
			const result = await deleteBroadcastTemplate(name);

			templates = result?.templates || templates;
		} catch (error) {
			showError(error?.message || 'Failed to delete template.');
		}
	}

	async function handleSchedule() {
		if (!scheduleTime || !selectedCount || !message.trim()) {
			showError('Set a time, select targets, and write a message.');
			return;
		}

		const sendAt = new Date(scheduleTime).getTime();

		if (sendAt <= Date.now()) {
			showError('Scheduled time must be in the future.');
			return;
		}

		const validButtons = buttons.filter((b) => b.label.trim());

		let schedMediaUrl = mediaUrl.trim() || undefined;

		if (mediaFile && !schedMediaUrl) {
			try {
				const formData = new FormData();

				formData.append('file', mediaFile);

				const uploadRes = await fetch('/api/dashboard/broadcast/upload-media', {
					method: 'POST',
					credentials: 'include',
					body: formData
				});

				if (!uploadRes.ok) {
					const err = await uploadRes.json().catch(() => ({}));

					throw new Error(err?.message || 'Upload failed');
				}

				const uploadData = await uploadRes.json();

				schedMediaUrl = uploadData.url;
			} catch (error) {
				showError(error?.message || 'Failed to upload media for scheduling.');
				return;
			}
		}

		try {
			const result = await scheduleBroadcast({
				targets: Array.from(selected),
				message: message.trim(),
				header: header.trim() || undefined,
				buttons: validButtons.length ? validButtons : undefined,
				mediaUrl: schedMediaUrl,
				mediaType: schedMediaUrl ? mediaType : undefined,
				delayMs,
				dryRun: false,
				sendAt
			});

			showSuccess(`Broadcast scheduled for ${new Date(sendAt).toLocaleString()}.`);
			const targetNames = Array.from(selected).map((jid, i) => {
				const t = targets.find((t) => t.jid === jid);

				return `${i + 1}. ${t?.subject || t?.name || jid}`;
			}).join('\n');

			schedules = [...schedules, { id: result.id, sendAt, targets: selected.size, message: message.trim().slice(0, 50), targetList: targetNames }];
		} catch (error) {
			showError(error?.message || 'Failed to schedule.');
		}
	}

	async function handleCancelSchedule(id) {
		try {
			await cancelScheduledBroadcast(id);
			schedules = schedules.filter((s) => s.id !== id);
			showSuccess('Scheduled broadcast cancelled.');
		} catch (error) {
			showError(error?.message || 'Failed to cancel.');
		}
	}

	async function handleSend() {
		if (!message.trim()) {
			showError('Message cannot be empty.');
			return;
		}

		if (!selectedCount) {
			showError('Select at least one target.');
			return;
		}

		const confirmText = dryRun
			? `Dry run: simulate sending to ${selectedCount} target${selectedCount > 1 ? 's' : ''}?`
			: `Send message to ${selectedCount} target${selectedCount > 1 ? 's' : ''}? This cannot be undone.`;

		const ok = await showConfirm({
			title: dryRun ? 'Dry Run' : 'Send Broadcast',
			message: confirmText,
			confirmLabel: dryRun ? 'Simulate' : 'Send',
			danger: !dryRun
		});

		if (!ok) {
			return;
		}

		sending = true;

		const validButtons = buttons.filter((b) => b.label.trim());

		try {
			let result;

			if (mediaFile) {
				const formData = new FormData();

				formData.append('targets', JSON.stringify(Array.from(selected)));
				formData.append('message', message.trim());

				if (header.trim()) {
					formData.append('header', header.trim());
				}

				if (validButtons.length) {
					formData.append('buttons', JSON.stringify(validButtons));
				}

				formData.append('mediaType', mediaType);
				formData.append('media', mediaFile);
				formData.append('delayMs', String(delayMs));
				formData.append('mentionAll', String(mentionAll));

				if (dryRun) {
					formData.append('dryRun', 'true');
				}

				const response = await fetch('/api/dashboard/broadcast/upload', {
					method: 'POST',
					credentials: 'include',
					body: formData
				});

				if (!response.ok) {
					const err = await response.json().catch(() => ({}));

					throw new Error(err?.message || `${response.status}`);
				}

				result = await response.json();
			} else {
				result = await sendBroadcast({
					targets: Array.from(selected),
					message: message.trim(),
					header: header.trim() || undefined,
					buttons: validButtons.length ? validButtons : undefined,
					mediaUrl: mediaUrl.trim() || undefined,
					mediaType: mediaUrl.trim() ? mediaType : undefined,
					mentionAll,
					delayMs,
					dryRun
				});
			}

			lastResult = { sent: result.sent, failed: result.failed, total: result.total, dryRun: result.dryRun, timestamp: Date.now() };
			showSuccess(`Broadcast ${dryRun ? '(dry run) ' : ''}complete: ${result.sent}/${result.total} sent.`);
		} catch (error) {
			showError(error?.message || 'Broadcast failed.');
		}

		sending = false;
	}
</script>

<div class="broadcast-page">
	<header class="page-head">
		<h2>Broadcast</h2>
		<p class="page-sub">Send a message to multiple groups or contacts at once.</p>
	</header>

	{#if loading}
		<div class="layout">
			<section class="section targets-panel">
				<header class="section-head">
					<h3 class="section-title">Targets <span class="section-count">—</span></h3>
				</header>
				<div class="category-tabs" aria-hidden="true">
					{#each Array(3) as _}
						<div class="tab-skeleton"></div>
					{/each}
				</div>
				<SkeletonList rows={10} rowHeight="2.8rem" />
			</section>
			<section class="section compose-panel">
				<header class="section-head">
					<h3 class="section-title">Compose</h3>
				</header>
				<SkeletonList rows={6} rowHeight="2.4rem" />
			</section>
		</div>
	{:else}
		<div class="layout">
			<section class="section targets-panel">
				<header class="section-head">
					<h3 class="section-title">Targets <span class="section-count">{selectedCount}/50</span></h3>
					<div class="head-actions">
						<input class="input search-input" type="text" placeholder="Search..." bind:value={search} />
					</div>
				</header>
				<div class="category-tabs">
					<button class="tab" class:active={category === 'groups'} on:click={() => category = 'groups'}>
						Groups ({groups.length})
					</button>
					<button class="tab" class:active={category === 'contacts'} on:click={() => category = 'contacts'}>
						Contacts ({contacts.length})
					</button>
					<button class="tab" class:active={category === 'all'} on:click={() => category = 'all'}>
						All
					</button>
					<button class="btn mini-btn" type="button" on:click={selectAll}>All</button>
					<button class="btn mini-btn" type="button" on:click={deselectAll}>None</button>
				</div>
				<div class="section-body target-list">
					{#each filtered as target (target.jid)}
						<button
							type="button"
							class="target-row"
							class:selected={selected.has(target.jid)}
							on:click={() => toggleTarget(target.jid)}
						>
							<span class="check" aria-hidden="true">{selected.has(target.jid) ? '✓' : ''}</span>
							<span class="target-name">{target.subject || target.name || target.jid}</span>
							<span class="target-type">{target.type === 'group' ? '👥' : '👤'}</span>
						</button>
					{/each}
				{#if !filtered.length}
					<p class="empty">{search ? `No targets found for '${search}'.` : 'No targets found.'}</p>
					{/if}
				</div>
			</section>

			<section class="section compose-panel">
				<header class="section-head">
					<h3 class="section-title">
						Compose
						{#if sending}
							<span class="sending-inline">
								<span class="sending-pulse"></span>
								Broadcasting...
							</span>
						{/if}
					</h3>
				</header>
				<div class="section-body compose-body">
					<div class="templates-bar">
						{#if templates.length}
							<Dropdown
								value=""
								options={[{ value: '', label: 'Load template...' }, ...templates.map(t => ({ value: t.name, label: t.name }))]}
								on:change={(e) => { if (e.detail) applyTemplate(templates.find(t => t.name === e.detail)); }}
							/>
						{/if}
						<button class="tb" type="button" on:click={saveCurrentTemplate}>💾 Save</button>
					</div>

					<div class="field-group">
						<span class="field-label">Header</span>
						<input class="input" type="text" placeholder="Broadcast" bind:value={header} />
					</div>

					<div class="field-group">
						<span class="field-label">Message</span>
						<div class="toolbar">
							<div class="toolbar-group">
								<Tooltip text="Bold (*text*)" placement="top">
									<button class="tb" type="button" on:click={() => wrapSelection('*')}>B</button>
								</Tooltip>
								<Tooltip text="Italic (_text_)" placement="top">
									<button class="tb" type="button" on:click={() => wrapSelection('_')}>I</button>
								</Tooltip>
								<Tooltip text="Strikethrough (~text~)" placement="top">
									<button class="tb" type="button" on:click={() => wrapSelection('~')}>S</button>
								</Tooltip>
								<Tooltip text="Monospace (```code```)" placement="top">
									<button class="tb mono" type="button" on:click={() => wrapSelection('```\n', '\n```')}>{'<>'}</button>
								</Tooltip>
							</div>
							<div class="toolbar-group">
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{groupName}')}>{'{groupName}'}</button>
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{memberCount}')}>{'{memberCount}'}</button>
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{botName}')}>{'{botName}'}</button>
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{prefix}')}>{'{prefix}'}</button>
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{date}')}>{'{date}'}</button>
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{time}')}>{'{time}'}</button>
								<button class="tb placeholder" type="button" on:click={() => insertPlaceholder('{newline}')}>{'{newline}'}</button>
							</div>
						</div>
						<textarea
							bind:this={msgTextarea}
							class="input msg-input"
							placeholder="Type your broadcast message..."
							bind:value={message}
							rows="5"
						></textarea>
					</div>

					<div class="field-group">
						<span class="field-label">Media (optional)</span>
						<div class="media-row">
							<Dropdown
								value={mediaType}
								options={MEDIA_TYPE_OPTIONS}
								on:change={(e) => (mediaType = e.detail)}
							/>
							<input class="input media-url" type="text" placeholder="https://... or drop a file below" bind:value={mediaUrl} />
						</div>
						<div
							class="drop-zone"
							class:dragging={isDragging}
							on:dragover|preventDefault={() => (isDragging = true)}
							on:dragleave={() => (isDragging = false)}
							on:drop|preventDefault={handleDrop}
							role="button"
							tabindex="0"
							on:click={() => fileInput?.click()}
							on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
						>
							{#if mediaFile}
								<span class="drop-file">{mediaFile.name} ({(mediaFile.size / 1024).toFixed(1)} KB)</span>
								<button class="remove-btn" type="button" on:click|stopPropagation={clearFile}>×</button>
							{:else}
								<span class="drop-text">Drop file here or click to browse</span>
							{/if}
						</div>
						<input
							bind:this={fileInput}
							type="file"
							accept="image/*,video/*,audio/*,application/*"
							class="hidden-input"
							on:change={handleFileSelect}
						/>
					</div>

					<div class="field-group">
						<span class="field-label">Buttons (max 3)</span>
						<div class="buttons-list">
							{#each buttons as btn, i (i)}
								<div class="btn-row">
									<Dropdown
										value={btn.type}
										options={BUTTON_TYPE_OPTIONS}
										on:change={(e) => { btn.type = e.detail; buttons = buttons; }}
									/>
									<input class="input btn-label" type="text" placeholder="Label" bind:value={btn.label} />
									{#if btn.type === 'url'}
										<input class="input btn-url" type="text" placeholder="https://..." bind:value={btn.url} />
									{:else}
										<input class="input btn-id" type="text" placeholder="ID (optional)" bind:value={btn.id} />
									{/if}
									<button class="remove-btn" type="button" on:click={() => removeButton(i)}>×</button>
								</div>
							{/each}
							{#if buttons.length < 3}
								<button class="btn add-btn" type="button" on:click={addButton}>+ Add button</button>
							{/if}
						</div>
					</div>

					<div class="options">
						<div class="option-row">
							<span class="option-label">Delay between messages (ms)</span>
							<NumberInput bind:value={delayMs} min={500} max={10000} step={100} />
						</div>
						<div class="option-row">
							<span class="option-label">Mention all participants</span>
							<Toggle checked={mentionAll} label="Mention all" on:change={(e) => (mentionAll = e.detail)} />
						</div>
						<div class="option-row">
							<span class="option-label">Dry run (simulate, don't send)</span>
							<Toggle checked={dryRun} label="Dry run" on:change={(e) => (dryRun = e.detail)} />
						</div>

						<div class="option-row schedule-row">
							<span class="option-label">Schedule</span>
							<input class="input schedule-input" type="datetime-local" bind:value={scheduleTime} />
							<button class="btn" type="button" disabled={!scheduleTime || !selectedCount || !message.trim()} on:click={handleSchedule}>
								Schedule
							</button>
						</div>

						{#if activeSchedules.length}
							<div class="schedules-list">
								{#each activeSchedules as sched (sched.id)}
									<div class="scheduled-banner">
										<Tooltip text={sched.targetList || `${sched.targets} targets`} placement="top">
											<span>📅 {new Date(sched.sendAt).toLocaleString()} · {sched.targets} targets</span>
										</Tooltip>
										<button class="btn" type="button" on:click={() => handleCancelSchedule(sched.id)}>Cancel</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<button
						class="btn primary send-btn"
						type="button"
						disabled={sending || !selectedCount || !message.trim()}
						on:click={handleSend}
					>
						{#if sending}
							Sending... ({estimatedLabel})
						{:else if dryRun}
							Simulate ({selectedCount})
						{:else}
							Send to {selectedCount} target{selectedCount !== 1 ? 's' : ''}
						{/if}
					</button>

					{#if sending}
						<span class="estimate">Broadcasting — {estimatedLabel} remaining</span>
					{:else if selectedCount > 0}
						<span class="estimate">Estimated time: {estimatedLabel}</span>
					{/if}

				</div>
			</section>
		</div>

		{#if lastResult}
			<section class="section history-panel">
				<header class="section-head">
					<h3 class="section-title">Last Broadcast</h3>
					<span class="section-count">{lastResult.dryRun ? 'Dry run' : 'Sent'}</span>
				</header>
				<div class="section-body history-body">
					<div class="history-row">
						<span class="history-label">Status</span>
						<span class="history-value">{lastResult.sent}/{lastResult.total} delivered{lastResult.failed ? ` · ${lastResult.failed} failed` : ''}</span>
					</div>
					<div class="history-row">
						<span class="history-label">Type</span>
						<span class="history-value">{lastResult.dryRun ? 'Dry run (simulated)' : 'Live broadcast'}</span>
					</div>
					{#if lastResult.timestamp}
						<div class="history-row">
							<span class="history-label">Time</span>
							<span class="history-value">{new Date(lastResult.timestamp).toLocaleString()}</span>
						</div>
					{/if}
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.broadcast-page {
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

	.layout {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: var(--space-4);
		align-items: stretch;
		height: clamp(520px, 74vh, 800px);
	}

	.layout > :global(*) {
		min-height: 0;
		height: 100%;
	}

	.head-actions {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
	}

	.search-input {
		max-width: 160px;
	}

	.category-tabs {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem var(--space-4);
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}

	.tab {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: var(--fs-xs);
		font-weight: 600;
		padding: 0.3rem 0.6rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background var(--tx-base), color var(--tx-base);
	}

	.tab:hover {
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.tab.active {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 16%, transparent);
	}

	.mini-btn {
		font-size: var(--fs-xs);
		padding: 0.2rem 0.5rem;
		margin-left: auto;
	}

	.mini-btn + .mini-btn {
		margin-left: 0;
	}

	.target-list {
		overflow-y: auto;
	}

	.target-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text);
		font-size: var(--fs-sm);
		text-align: left;
		cursor: pointer;
		transition: background var(--tx-base);
	}

	.target-row:hover {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}

	.target-row.selected {
		background: color-mix(in srgb, var(--accent) 16%, transparent);
	}

	.check {
		width: 18px;
		height: 18px;
		display: inline-grid;
		place-items: center;
		border-radius: 4px;
		border: 1px solid var(--border);
		font-size: 0.7rem;
		color: var(--accent);
		flex-shrink: 0;
	}

	.target-row.selected .check {
		background: var(--accent);
		color: var(--bg);
		border-color: var(--accent);
	}

	.target-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.target-type {
		font-size: var(--fs-xs);
		flex-shrink: 0;
	}

	.compose-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		overflow-y: auto;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}

	.toolbar-group {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
	}

	.templates-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}

	.tb {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text);
		font-size: var(--fs-xs);
		font-weight: 700;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--tx-base), color var(--tx-base), background var(--tx-base);
	}

	.tb:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.tb.mono {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
	}

	.tb.placeholder {
		font-weight: 500;
		font-size: 0.68rem;
		color: var(--muted);
		border-color: color-mix(in srgb, var(--border) 70%, transparent);
	}

	.tb.placeholder:hover {
		color: var(--accent);
		border-color: var(--accent);
	}

	.schedule-row {
		flex-wrap: wrap;
	}

	.schedule-input {
		width: auto;
		font-size: var(--fs-sm);
	}

	.scheduled-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
		font-size: var(--fs-sm);
	}

	.schedules-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.field-label {
		font-size: var(--fs-xs);
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.msg-input {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		line-height: 1.5;
	}

	.media-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.media-url {
		flex: 1;
	}

	.drop-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3);
		border: 2px dashed var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--tx-base), background var(--tx-base);
	}

	.drop-zone:hover, .drop-zone.dragging {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.drop-text {
		font-size: var(--fs-sm);
		color: var(--muted);
	}

	.drop-file {
		font-size: var(--fs-sm);
		color: var(--text);
		font-weight: 500;
	}

	.hidden-input {
		display: none;
	}

	.buttons-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.btn-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.btn-label {
		flex: 1;
	}

	.btn-url {
		flex: 1.5;
	}

	.btn-id {
		flex: 1;
	}

	.remove-btn {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0 0.3rem;
		border-radius: 50%;
		transition: color var(--tx-base);
	}

	.remove-btn:hover {
		color: #ff8e74;
	}

	.add-btn {
		align-self: flex-start;
		font-size: var(--fs-xs);
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.option-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.option-label {
		font-size: var(--fs-sm);
		color: var(--muted);
	}

	.send-btn {
		align-self: flex-start;
		margin-top: var(--space-2);
	}

	.estimate {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.sending-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: var(--fs-xs);
		font-weight: 500;
		color: var(--accent);
		margin-left: var(--space-2);
	}

	.sending-pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		animation: pulse-broadcast 1.2s ease-in-out infinite;
		flex-shrink: 0;
	}

	@keyframes pulse-broadcast {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.7); }
	}

	.input {
		max-width: none;
	}

	.history-panel {
		margin-top: var(--space-4);
	}

	.history-body {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.history-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-sm);
	}

	.history-row:hover {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.history-label {
		font-size: var(--fs-sm);
		color: var(--muted);
	}

	.history-value {
		font-size: var(--fs-sm);
		color: var(--text);
		font-weight: 600;
	}

	.tab-skeleton {
		height: 1.8rem;
		width: 70px;
		border-radius: var(--radius-sm);
		background: linear-gradient(
			100deg,
			var(--panel) 0%,
			color-mix(in srgb, var(--accent) 14%, transparent) 50%,
			var(--panel) 100%
		);
		background-size: 220% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%   { background-position-x: 100%; }
		100% { background-position-x: -120%; }
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
			height: auto;
		}

		.layout > :global(*) {
			height: clamp(300px, 50vh, 500px);
		}
	}

	@media (max-width: 640px) {
		.toolbar {
			gap: var(--space-2);
		}

		.toolbar-group {
			flex-wrap: wrap;
			width: 100%;
			gap: 0.3rem;
		}

		.toolbar-group .tb {
			min-height: 36px;
			flex: 0 0 auto;
		}

		.btn-row {
			display: grid;
			grid-template-columns: 1fr auto;
			grid-template-areas:
				"type remove"
				"label label"
				"url url";
			gap: 0.4rem;
		}

		.btn-row > :global(.dropdown) {
			grid-area: type;
		}

		.btn-row .btn-label {
			grid-area: label;
		}

		.btn-row .btn-url,
		.btn-row .btn-id {
			grid-area: url;
		}

		.btn-row .remove-btn {
			grid-area: remove;
			min-width: 44px;
			min-height: 44px;
		}

		.media-row {
			flex-wrap: wrap;
		}

		.media-url {
			flex: 1 1 100%;
		}

		.option-row {
			flex-wrap: wrap;
		}

		.schedule-row .schedule-input {
			flex: 1 1 100%;
		}

		.tb {
			min-height: 36px;
		}
	}
</style>
