<script>
	import { setUserBanned, setUserBlocked, setUserLimit, setUserPremium } from '../lib/api.js';
	import { maskJid, unmaskedAvailable } from '../lib/jid.js';
	import { users } from '../lib/stores.js';
	import { showError, showUndoToast } from '../lib/toast.js';
	import ButtonPill from './ui/ButtonPill.svelte';
	import NumberInput from './ui/NumberInput.svelte';
	import Tooltip from './ui/Tooltip.svelte';
	import SkeletonList from './ui/SkeletonList.svelte';

	export let isViewer = false;

	let search = '';
	let editingId = null;
	let editingValue = '';
	let pending = {};
	let storeLoaded = false;

	$: if ($users.length > 0) storeLoaded = true;

	$: filtered = $users.filter((user) => {
		if (!search) {
			return true;
		}

		const term = search.toLowerCase();

		return (
			user.id?.toLowerCase().includes(term) ||
			user.role?.toLowerCase().includes(term) ||
			(user.premium && 'premium'.includes(term)) ||
			(user.banned && 'banned'.includes(term)) ||
			(user.blocked && 'blocked'.includes(term))
		);
	});

	function roleClass(role) {
		const r = String(role || '').toUpperCase();

		if (r === 'OWNER') return 'role-badge owner';
		if (r === 'PREMIUM') return 'role-badge premium';

		return 'role-badge';
	}

	function actionKey(userId, action) {
		return `${userId}:${action}`;
	}

	function isPending(userId, action) {
		return Boolean(pending[actionKey(userId, action)]);
	}

	function setPending(userId, action, value) {
		const key = actionKey(userId, action);

		if (value) {
			pending = { ...pending, [key]: true };
		} else {
			const next = { ...pending };

			delete next[key];
			pending = next;
		}
	}

	function patchUser(userId, patch) {
		users.update((list) =>
			list.map((entry) => (entry.id === userId ? { ...entry, ...patch } : entry))
		);
	}

	function canEdit(user) {
		if (isViewer) {
			return false;
		}

		return unmaskedAvailable(user?.id || '');
	}

	async function startEditLimit(user) {
		if (!canEdit(user)) {
			return;
		}

		editingId = user.id;
		editingValue = String(user.limit ?? 0);
	}

	function cancelEditLimit() {
		editingId = null;
		editingValue = '';
	}

	async function commitEditLimit(user) {
		if (editingId !== user.id) {
			return;
		}

		const next = Math.max(0, Math.floor(Number(editingValue)));

		if (!Number.isFinite(next)) {
			cancelEditLimit();
			return;
		}

		if (next === Number(user.limit ?? 0)) {
			cancelEditLimit();
			return;
		}

		setPending(user.id, 'limit', true);

		try {
			const data = await setUserLimit(user.id, next);
			const applied = Number(data?.user?.limit ?? next);

			patchUser(user.id, { limit: applied });

			if (data?.undo?.token) {
				showUndoToast({
					message: `Limit for ${maskJid(user.id)} set to ${applied}.`,
					undo: data.undo
				});
			}
		} catch (error) {
			showError(error?.message || 'Failed to update limit.');
		}

		setPending(user.id, 'limit', false);
		cancelEditLimit();
	}

	async function toggleAttribute(user, attribute) {
		if (!canEdit(user)) {
			return;
		}

		if (isPending(user.id, attribute)) {
			return;
		}

		const current = Boolean(user[attribute]);
		const next = !current;

		setPending(user.id, attribute, true);

		try {
			let response;

			if (attribute === 'premium') {
				response = await setUserPremium(user.id, next);
			} else if (attribute === 'banned') {
				response = await setUserBanned(user.id, next);
			} else if (attribute === 'blocked') {
				response = await setUserBlocked(user.id, next);
			}

			const patch = {};

			if (attribute === 'premium') {
				patch.premium = Boolean(response?.user?.role === 'PREMIUM' || next);
				patch.role = response?.user?.role || (next ? 'PREMIUM' : 'FREE');
			} else if (attribute === 'banned') {
				patch.banned = Boolean(response?.banned ?? next);
			} else if (attribute === 'blocked') {
				patch.blocked = Boolean(response?.blocked ?? next);
			}

			patchUser(user.id, patch);

			if (response?.undo?.token) {
				showUndoToast({
					message: undoMessage(user, attribute, next),
					undo: response.undo
				});
			}
		} catch (error) {
			showError(error?.message || `Failed to update ${attribute}.`);
		}

		setPending(user.id, attribute, false);
	}

	function undoMessage(user, attribute, next) {
		const masked = maskJid(user.id);

		if (attribute === 'premium') {
			return `${masked} is now ${next ? 'PREMIUM' : 'FREE'}.`;
		}

		if (attribute === 'banned') {
			return `${masked} ${next ? 'banned' : 'unbanned'}.`;
		}

		return `${masked} ${next ? 'blocked' : 'unblocked'}.`;
	}
</script>

<section class="section user-list">
	<header class="section-head">
		<h3 class="section-title">Users <span class="section-count">{$users.length}</span></h3>
		<input class="input" type="text" placeholder="Search users..." bind:value={search} />
	</header>
	<div class="list">
		{#if !storeLoaded}
			<SkeletonList rows={10} rowHeight="2.2rem" />
		{:else}
		{#each filtered as user (user.id)}
			{@const editable = canEdit(user)}
			{@const limitBusy = isPending(user.id, 'limit')}
			{@const premiumBusy = isPending(user.id, 'premium')}
			{@const bannedBusy = isPending(user.id, 'banned')}
			{@const blockedBusy = isPending(user.id, 'blocked')}
			<div class="row">
				<Tooltip text={user.id || ''} placement="top">
					<span class="jid" aria-label="User JID">{maskJid(user.id || '')}</span>
				</Tooltip>
				<span class={roleClass(user.role)}>{user.role || 'FREE'}</span>
				{#if editable}
					<NumberInput
						value={Number(user.limit ?? 0)}
						min={0}
						disabled={limitBusy}
						on:change={(event) => { editingValue = String(event.detail); editingId = user.id; commitEditLimit(user); }}
					/>
				{:else}
					<span class="limit">{user.limit ?? '—'}</span>
				{/if}
				<div class="chips">
					<ButtonPill>
						<button
							type="button"
							class:active={user.premium}
							disabled={!editable || premiumBusy}
							aria-pressed={Boolean(user.premium)}
							on:click={() => toggleAttribute(user, 'premium')}
						>
							Premium
						</button>
						<button
							type="button"
							class="danger"
							class:active={user.banned}
							disabled={!editable || bannedBusy}
							aria-pressed={Boolean(user.banned)}
							on:click={() => toggleAttribute(user, 'banned')}
						>
							Banned
						</button>
						<button
							type="button"
							class="danger"
							class:active={user.blocked}
							disabled={!editable || blockedBusy}
							aria-pressed={Boolean(user.blocked)}
							on:click={() => toggleAttribute(user, 'blocked')}
						>
							Blocked
						</button>
					</ButtonPill>
				</div>
			</div>
		{/each}
		{#if !filtered.length}
			<p class="empty">No users found.</p>
		{/if}
		{/if}
	</div>
</section>

<style>
	.user-list {
		max-height: 480px;
	}

	.list {
		overflow-y: auto;
		padding: var(--space-2) var(--space-4);
		flex: 1;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto auto;
		align-items: center;
		padding: 0.45rem 0.4rem;
		gap: var(--space-3);
		border-radius: var(--radius-sm);
		transition: background var(--tx-base);
	}

	.chips {
		display: inline-flex;
	}

	.row:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.jid {
		color: var(--text);
		font-size: var(--fs-sm);
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: inline-block;
		max-width: 100%;
	}

	.limit {
		color: var(--muted);
		font-size: var(--fs-xs);
		min-width: 2.4rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	:global(.pill button.active) {
		background: rgba(240, 200, 135, 0.22) !important;
		color: #f0c887 !important;
	}

	:global(.pill button.danger.active) {
		background: rgba(255, 142, 116, 0.18) !important;
		color: #ff8e74 !important;
	}

	.input {
		max-width: 220px;
	}

	@media (max-width: 720px) {
		.row {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				"jid role"
				"limit chips";
			row-gap: 0.4rem;
			column-gap: var(--space-2);
			align-items: center;
		}

		.row > :global(.tooltip-host) {
			grid-area: jid;
			min-width: 0;
		}

		.row :global(.role-badge) {
			grid-area: role;
			justify-self: end;
		}

		.row .limit,
		.row > :global(.number-input) {
			grid-area: limit;
			justify-self: start;
		}

		.chips {
			grid-area: chips;
			justify-self: end;
		}

		.chips :global(.pill) {
			display: flex;
		}

		.chips :global(.pill button) {
			flex: 1 1 0;
		}
	}

	@media (max-width: 540px) {
		.input {
			max-width: 100%;
			flex: 1;
		}
	}
</style>
