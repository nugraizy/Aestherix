<script>
	import { onMount, afterUpdate, tick } from 'svelte';
	import { get, post, patch } from '../../lib/api.js';
	import { showError } from '../../lib/toast.js';
	import Tooltip from '../ui/Tooltip.svelte';

	export let active = true;

	let sessions = [];
	let activeSession = null;
	let activeSessionId = null;
	let messages = [];
	let input = '';
	let sending = false;
	let loadingSessions = false;
	let loadingSession = false;
	let messagesEl;
	let inputEl;
	let renaming = false;
	let renameValue = '';
	let sidebarOpen = true;

	let typingIndex = -1;
	let typingLength = 0;
	let typingTimer = null;
	const TYPING_SPEED = 12;
	const TYPING_CHUNK = 3;

	let attachedImage = null;
	let attachedImagePreview = null;
	let fileInputEl;

	const IMAGE_PATTERN = /^(generate|create|make|draw|imagine|paint|sketch)\s+(an?\s+)?(image|picture|photo|illustration|artwork|drawing|painting|art)\s*(of|about|showing)?\s*/i;

	$: if (active && sessions.length === 0) loadSessions();
	$: if (activeSessionId) {
		stopTypingAnimation();
		loadSession(activeSessionId);
	}
	$: contextCount = messages.filter((m) => m.role !== 'system').length;

	onMount(() => {
		if (active) loadSessions();

		return () => stopTypingAnimation();
	});

	afterUpdate(() => {
		scrollToBottom();
	});

	function isImageRequest(text) {
		return IMAGE_PATTERN.test(text.trim());
	}

	function extractImagePrompt(text) {
		return text.trim().replace(IMAGE_PATTERN, '').trim() || text.trim();
	}

	function handleFileSelect(e) {
		const file = e.target.files?.[0];

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			showError('Only image files are supported');
			return;
		}

		if (file.size > 20 * 1024 * 1024) {
			showError('Image must be under 20MB');
			return;
		}

		attachedImage = file;
		const reader = new FileReader();

		reader.onload = (ev) => {
			attachedImagePreview = ev.target.result;
		};

		reader.readAsDataURL(file);
		if (fileInputEl) fileInputEl.value = '';
	}

	function clearAttachment() {
		attachedImage = null;
		attachedImagePreview = null;
	}

	async function loadSessions() {
		loadingSessions = true;

		try {
			const data = await get('/chat/sessions');

			sessions = data.sessions || [];
		} catch {
			// silent
		}

		loadingSessions = false;
	}

	async function loadSession(id) {
		loadingSession = true;

		try {
			const data = await get(`/chat/sessions/${id}`);

			activeSession = data.session;
			messages = data.session.messages || [];
			await tick();
			scrollToBottom();
		} catch {
			showError('Failed to load session');
		}

		loadingSession = false;
	}

	async function createNewSession() {
		try {
			const data = await post('/chat/sessions');

			sessions = [data.session, ...sessions];
			activeSessionId = data.session.id;
			input = '';

			if (!sidebarOpen) sidebarOpen = true;
		} catch {
			showError('Failed to create session');
		}
	}

	async function deleteSession(id, e) {
		e.stopPropagation();

		try {
			await fetch(`/api/dashboard/chat/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
			sessions = sessions.filter((s) => s.id !== id);

			if (activeSessionId === id) {
				activeSessionId = sessions[0]?.id || null;
				if (!activeSessionId) {
					activeSession = null;
					messages = [];
				}
			}
		} catch {
			showError('Failed to delete session');
		}
	}

	function startRename(session, e) {
		e.stopPropagation();
		renaming = session.id;
		renameValue = session.title;
	}

	async function finishRename(id) {
		renaming = false;

		if (!renameValue.trim()) return;

		try {
			await patch(`/chat/sessions/${id}`, { title: renameValue.trim() });
			sessions = sessions.map((s) => s.id === id ? { ...s, title: renameValue.trim() } : s);

			if (activeSession?.id === id) {
				activeSession.title = renameValue.trim();
			}
		} catch {
			showError('Failed to rename session');
		}
	}

	async function sendMessage() {
		const content = input.trim();
		const hasImage = !!attachedImage;

		if ((!content && !hasImage) || sending || !activeSessionId) return;

		const imagePreview = attachedImagePreview;
		const imageFile = attachedImage;

		input = '';
		attachedImage = null;
		attachedImagePreview = null;
		sending = true;

		messages = [...messages, {
			role: 'user',
			content: content || (hasImage ? 'What do you see in this image?' : ''),
			timestamp: Date.now(),
			image: imagePreview?.startsWith('data:') ? imagePreview : null
		}];

		await tick();
		scrollToBottom();

		try {
			let data;

			if (hasImage) {
				const formData = new FormData();

				formData.append('image', imageFile);

				if (content) {
					formData.append('caption', content);
				}

				const resp = await fetch(`/api/dashboard/chat/sessions/${activeSessionId}/vision`, {
					method: 'POST',
					body: formData,
					credentials: 'include'
				});

				if (!resp.ok) {
					const err = await resp.json().catch(() => ({}));

					throw new Error(err.error || 'Image processing failed');
				}

				data = await resp.json();

				const newIndex = messages.length;

				messages = [...messages, {
					role: 'assistant',
					content: data.message,
					timestamp: Date.now()
				}];

				startTypingAnimation(newIndex);
			} else if (isImageRequest(content)) {
				const prompt = extractImagePrompt(content);

				data = await post(`/chat/sessions/${activeSessionId}/image`, { prompt });

				if (data.image) {
					const newIndex = messages.length;

					messages = [...messages, {
						role: 'assistant',
						content: `Generated from: "${prompt}"`,
						timestamp: Date.now(),
						image: data.image
					}];

					startTypingAnimation(newIndex);
				}
			} else {
				data = await post(`/chat/sessions/${activeSessionId}/messages`, { content });

				const newIndex = messages.length;

				messages = [...messages, {
					role: 'assistant',
					content: data.message,
					timestamp: Date.now()
				}];

				startTypingAnimation(newIndex);
			}

			const idx = sessions.findIndex((s) => s.id === activeSessionId);

			if (idx !== -1 && sessions[idx].title === 'New Chat') {
				await loadSessions();
			} else {
				sessions = sessions.map((s) => s.id === activeSessionId
					? { ...s, messageCount: messages.length, updatedAt: Date.now() }
					: s
				);
			}
		} catch (err) {
			messages = [...messages, {
				role: 'assistant',
				content: err.message || 'Failed to get response',
				timestamp: Date.now(),
				error: true
			}];
		}

		sending = false;
		await tick();
		scrollToBottom();
	}

	function getDisplayContent(msg, index) {
		if (index === typingIndex && typingLength < msg.content.length) {
			return msg.content.slice(0, typingLength);
		}

		return msg.content;
	}

	function startTypingAnimation(index) {
		stopTypingAnimation();
		typingIndex = index;
		typingLength = 0;

		const msg = messages[index];

		if (!msg) return;

		const total = msg.content.length;

		typingTimer = setInterval(() => {
			typingLength += TYPING_CHUNK;

			if (typingLength >= total) {
				typingLength = total;
				stopTypingAnimation();
			}

			messages = messages;
			scrollToBottom();
		}, TYPING_SPEED);
	}

	function stopTypingAnimation() {
		if (typingTimer) {
			clearInterval(typingTimer);
			typingTimer = null;
		}

		typingIndex = -1;
		typingLength = 0;
	}

	function handleInputKey(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function scrollToBottom() {
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	}

	function formatTime(ts) {
		if (!ts) return '';

		const d = new Date(ts);

		return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(ts) {
		if (!ts) return '';

		const d = new Date(ts);
		const now = new Date();
		const diff = now - d;

		if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
		if (diff < 172800000) return 'Yesterday';

		return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
	}

	function renderContent(text) {
		if (!text) return '';

		let html = escapeHtml(text);

		html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
			return `<pre class="code-block"><code class="lang-${lang || 'text'}">${code.trim()}</code></pre>`;
		});

		html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
		html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
		html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
		html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
		html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
		html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
		html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
		html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
		html = html.replace(/\n/g, '<br>');

		return html;
	}

	function escapeHtml(text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
</script>

<div class="chat-tool" class:active class:sidebar-collapsed={!sidebarOpen}>
	<aside class="sidebar">
		{#if sidebarOpen}
			<div class="sidebar-head">
				<button class="new-chat-btn" type="button" on:click={createNewSession}>
					<i class="nf nf-md-plus"></i>
					New Chat
				</button>
			</div>

			<div class="session-list">
				{#if loadingSessions}
					<div class="session-loading">Loading...</div>
				{:else if sessions.length === 0}
					<div class="session-empty">No conversations yet</div>
				{:else}
					{#each sessions as session (session.id)}
						<div
							class="session-item"
							class:active={activeSessionId === session.id}
							on:click={() => (activeSessionId = session.id)}
							on:keydown={(e) => e.key === 'Enter' && (activeSessionId = session.id)}
							role="button"
							tabindex="0"
						>
							<div class="session-info">
								{#if renaming === session.id}
									<input
										class="rename-input"
										type="text"
										bind:value={renameValue}
										on:blur={() => finishRename(session.id)}
										on:keydown={(e) => e.key === 'Enter' && finishRename(session.id)}
									/>
								{:else}
									<span class="session-title">{session.title}</span>
								{/if}
								<span class="session-meta">
									{session.messageCount} messages &middot; {formatDate(session.updatedAt)}
								</span>
							</div>
							<div class="session-actions">
								<Tooltip text="Rename">
									<button class="session-action" type="button" aria-label="Rename session" on:click={(e) => startRename(session, e)}>
										<i class="nf nf-md-pencil"></i>
									</button>
								</Tooltip>
								<Tooltip text="Delete">
									<button class="session-action danger" type="button" aria-label="Delete session" on:click={(e) => deleteSession(session.id, e)}>
										<i class="nf nf-md-delete"></i>
									</button>
								</Tooltip>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</aside>

	<main class="chat-main">
		{#if activeSessionId}
			<header class="chat-header">
				<div class="chat-header-info">
				<Tooltip text={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
					<button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" on:click={() => (sidebarOpen = !sidebarOpen)}>
						<i class="nf nf-md-menu"></i>
					</button>
				</Tooltip>
				<h3>{activeSession?.title || 'Chat'}</h3>
					<span class="context-badge">
						<i class="nf nf-md-message_text_outline"></i>
						{contextCount} messages
					</span>
				</div>
			</header>

			<div class="messages" bind:this={messagesEl}>
				{#if loadingSession}
					<div class="messages-loading">
						<span class="spinner"></span>
					</div>
				{:else if messages.length === 0}
					<div class="messages-empty">
						<div class="empty-icon">
							<i class="nf nf-md-robot_angry_outline"></i>
						</div>
						<h3>Start a conversation</h3>
						<p>Type a message below to begin chatting with the AI assistant.</p>
						<p class="hint">Try: "generate an image of a sunset over mountains"</p>
					</div>
				{:else}
					{#each messages as msg, i (i)}
						<div class="message {msg.role}" class:error={msg.error}>
							<div class="message-avatar">
								{#if msg.role === 'user'}
									<i class="nf nf-md-account"></i>
								{:else}
									<i class="nf nf-md-robot_angry_outline"></i>
								{/if}
							</div>
							<div class="message-body">
								{#if msg.image}
									<div class="message-image">
										<img src={msg.image.startsWith('data:') ? msg.image : `data:image/jpeg;base64,${msg.image}`} alt="" />
									</div>
								{/if}
								<div class="message-content">
									{@html renderContent(getDisplayContent(msg, i))}
									{#if i === typingIndex && typingLength < msg.content.length}
										<span class="typing-cursor"></span>
									{/if}
								</div>
								<span class="message-time">{formatTime(msg.timestamp)}</span>
							</div>
						</div>
					{/each}
				{/if}

				{#if sending}
					<div class="message assistant thinking">
						<div class="message-avatar">
							<i class="nf nf-md-robot_angry_outline"></i>
						</div>
						<div class="message-body">
							<div class="thinking-dots">
								<span></span><span></span><span></span>
							</div>
						</div>
					</div>
				{/if}
			</div>

	<div class="input-area">
			<input
				type="file"
				accept="image/*"
				bind:this={fileInputEl}
				on:change={handleFileSelect}
				style="display: none;"
			/>
			{#if attachedImagePreview}
				<div class="attachment-preview">
					<img src={attachedImagePreview} alt="Attached" />
					<button class="attachment-remove" type="button" aria-label="Remove attachment" on:click={clearAttachment}>
						<i class="nf nf-md-close"></i>
					</button>
				</div>
			{/if}
			<div class="input-row">
				<textarea
					class="chat-input"
					bind:this={inputEl}
					bind:value={input}
					placeholder={attachedImage ? 'Add a caption (optional)...' : 'Type a message... (try \'generate an image of...\')'}
					rows="1"
					on:keydown={handleInputKey}
					disabled={sending}
				></textarea>
				<Tooltip text="Attach image">
					<button class="attach-btn" type="button" aria-label="Attach image" on:click={() => fileInputEl?.click()} disabled={sending}>
						<i class="nf nf-md-paperclip"></i>
					</button>
				</Tooltip>
				<button
					class="send-btn"
					type="button"
					aria-label="Send message"
					on:click={sendMessage}
					disabled={(!input.trim() && !attachedImage) || sending}
				>
					<i class="nf nf-md-send"></i>
				</button>
			</div>
		</div>
		{:else}
			<div class="no-session">
				<Tooltip text={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
					<button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" on:click={() => (sidebarOpen = !sidebarOpen)}>
						<i class="nf nf-md-menu"></i>
					</button>
				</Tooltip>
				<div class="empty-icon">
					<i class="nf nf-md-robot_angry_outline"></i>
				</div>
				<h3>AI Chat</h3>
				<p>Create a new conversation to get started.</p>
				<button class="new-chat-btn large" type="button" on:click={createNewSession}>
					<i class="nf nf-md-plus"></i>
					New Chat
				</button>
			</div>
		{/if}
	</main>
</div>

<style>
	.chat-tool {
		display: flex;
		height: 540px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--panel);
	}

	.sidebar {
		width: 260px;
		min-width: 260px;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--border);
		background: var(--bg);
		transition: width var(--tx-base), min-width var(--tx-base);
		overflow: hidden;
	}

	.sidebar-collapsed .sidebar {
		width: 0;
		min-width: 0;
		border-right: none;
	}

	.sidebar-head {
		padding: var(--space-3);
		border-bottom: 1px solid var(--border);
	}

	.new-chat-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--accent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--tx-fast);
	}

	.new-chat-btn:hover {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
	}

	.new-chat-btn.large {
		max-width: 200px;
		margin-top: var(--space-2);
	}

	.session-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.session-loading,
	.session-empty {
		padding: var(--space-4);
		text-align: center;
		color: var(--muted);
		font-size: var(--fs-sm);
	}

	.session-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.6rem var(--space-3);
		cursor: pointer;
		transition: background var(--tx-fast);
		border: none;
		background: transparent;
		text-align: left;
	}

	.session-item:hover {
		background: color-mix(in srgb, var(--accent) 6%, transparent);
	}

	.session-item.active {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		border-right: 2px solid var(--accent);
	}

	.session-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.session-title {
		font-size: var(--fs-sm);
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.session-meta {
		font-size: var(--fs-xs);
		color: var(--muted);
	}

	.rename-input {
		padding: 0.15rem 0.3rem;
		border: 1px solid var(--accent);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--text);
		font-size: var(--fs-sm);
		outline: none;
		width: 100%;
	}

	.session-actions {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity var(--tx-fast);
	}

	.session-item:hover .session-actions {
		opacity: 1;
	}

	.session-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.75rem;
		transition: all var(--tx-fast);
	}

	.session-action:hover {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
	}

	.session-action.danger:hover {
		background: color-mix(in srgb, #ff8e74 15%, transparent);
		color: #ff8e74;
	}

	.chat-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.chat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--border);
		background: var(--bg);
	}

	.chat-header-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.sidebar-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-size: 1rem;
		transition: all var(--tx-fast);
	}

	.sidebar-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.chat-header h3 {
		margin: 0;
		font-size: var(--fs-md);
		font-weight: 600;
	}

	.context-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
		font-size: var(--fs-xs);
		font-weight: 600;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.messages-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.messages-empty,
	.no-session {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: var(--space-2);
		color: var(--muted);
		text-align: center;
		padding: var(--space-4);
	}

	.no-session {
		position: relative;
	}

	.no-session .sidebar-toggle {
		position: absolute;
		top: var(--space-3);
		left: var(--space-3);
	}

	.empty-icon {
		font-size: 2.5rem;
		color: color-mix(in srgb, var(--accent) 40%, var(--muted));
		margin-bottom: var(--space-2);
	}

	.messages-empty h3,
	.no-session h3 {
		margin: 0;
		font-size: var(--fs-lg);
		color: var(--text);
	}

	.messages-empty p,
	.no-session p {
		margin: 0;
		font-size: var(--fs-sm);
	}

	.hint {
		opacity: 0.6;
		font-style: italic;
	}

	.message {
		display: flex;
		gap: var(--space-3);
		max-width: 85%;
	}

	.message.user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.message-avatar {
		width: 32px;
		height: 32px;
		min-width: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
	}

	.message.user .message-avatar {
		background: color-mix(in srgb, var(--accent) 20%, var(--bg));
		color: var(--accent);
	}

	.message.assistant .message-avatar {
		background: var(--bg);
		color: var(--muted);
		border: 1px solid var(--border);
	}

	.message-body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.message.user .message-body {
		align-items: flex-end;
	}

	.message-image {
		margin-bottom: 0.3rem;
	}

	.message-image img {
		max-width: 320px;
		max-height: 320px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		object-fit: contain;
		cursor: pointer;
		transition: transform var(--tx-fast);
	}

	.message-image img:hover {
		transform: scale(1.02);
	}

	.message-content {
		padding: 0.6rem 0.85rem;
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		line-height: 1.55;
		word-break: break-word;
	}

	.message.user .message-content {
		background: color-mix(in srgb, var(--accent) 18%, var(--bg));
		color: var(--text);
		border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--border));
		border-radius: var(--radius-sm) var(--radius-sm) 4px var(--radius-sm);
	}

	.message.assistant .message-content {
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm) var(--radius-sm) var(--radius-sm) 4px;
	}

	.message.error .message-content {
		border-color: color-mix(in srgb, #ff8e74 40%, var(--border));
		color: #ff8e74;
	}

	.message-content :global(pre.code-block) {
		margin: 0.4rem 0;
		padding: 0.6rem 0.8rem;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: var(--fs-xs);
		line-height: 1.5;
	}

	.message-content :global(code.inline-code) {
		padding: 0.1rem 0.3rem;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 3px;
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		font-size: 0.85em;
	}

	.message-content :global(h2),
	.message-content :global(h3),
	.message-content :global(h4) {
		margin: 0.4rem 0 0.2rem;
		font-weight: 700;
	}

	.message-content :global(ul) {
		margin: 0.3rem 0;
		padding-left: 1.2rem;
	}

	.message-content :global(li) {
		margin: 0.15rem 0;
	}

	.message-content :global(strong) {
		font-weight: 700;
	}

	.message-time {
		font-size: 0.65rem;
		color: var(--muted);
		padding: 0 0.3rem;
	}

	.thinking-dots {
		display: flex;
		gap: 4px;
		padding: 0.6rem 0.85rem;
	}

	.thinking-dots span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--muted);
		animation: dotPulse 1.4s ease-in-out infinite;
	}

	.thinking-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.thinking-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes dotPulse {
		0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
		40% { opacity: 1; transform: scale(1); }
	}

	.typing-cursor {
		display: inline-block;
		width: 2px;
		height: 1em;
		background: var(--accent);
		margin-left: 1px;
		vertical-align: text-bottom;
		animation: cursorBlink 0.6s step-end infinite;
	}

	@keyframes cursorBlink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	.input-area {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-top: 1px solid var(--border);
		background: var(--bg);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
	}

	.attachment-preview {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.3rem;
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		position: relative;
		width: fit-content;
		max-width: 200px;
	}

	.attachment-preview img {
		max-width: 100%;
		max-height: 80px;
		border-radius: 4px;
		object-fit: contain;
	}

	.attachment-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, #ff8e74 20%, var(--bg));
		color: #ff8e74;
		cursor: pointer;
		font-size: 0.65rem;
		flex-shrink: 0;
		transition: all var(--tx-fast);
	}

	.attachment-remove:hover {
		background: color-mix(in srgb, #ff8e74 35%, var(--bg));
	}

	.attach-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-size: 1rem;
		flex-shrink: 0;
		transition: all var(--tx-fast);
	}

	.attach-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.attach-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.chat-input {
		flex: 1;
		resize: none;
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: inherit;
		outline: none;
		transition: border-color var(--tx-base);
		max-height: 120px;
		line-height: 1.4;
	}

	.chat-input:focus {
		border-color: var(--accent);
	}

	.chat-input:disabled {
		opacity: 0.5;
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 50%;
		background: var(--accent);
		color: var(--bg);
		cursor: pointer;
		font-size: 0.9rem;
		transition: all var(--tx-fast);
	}

	.send-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: 1.2rem;
		height: 1.2rem;
		border: 2px solid transparent;
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 640px) {
		.chat-tool {
			flex-direction: column;
			height: auto;
			min-height: 540px;
		}

		.sidebar {
			width: 100%;
			min-width: unset;
			max-height: 200px;
			border-right: none;
			border-bottom: 1px solid var(--border);
		}

		.sidebar-collapsed .sidebar {
			max-height: 0;
			border-bottom: none;
		}

		.message {
			max-width: 95%;
		}

		.message-image img {
			max-width: 240px;
			max-height: 240px;
		}
	}
</style>
