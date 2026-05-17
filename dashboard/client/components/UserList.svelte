<script>
	import { users } from '../lib/stores.js';
	import { maskJid } from '../lib/jid.js';
	import Tooltip from './ui/Tooltip.svelte';

	let search = '';

	$: filtered = $users.filter((u) =>
		!search || u.id?.includes(search) || u.role?.toLowerCase().includes(search.toLowerCase())
	);

	function roleClass(role) {
		const r = String(role || '').toUpperCase();

		if (r === 'OWNER') return 'role-badge owner';
		if (r === 'PREMIUM') return 'role-badge premium';

		return 'role-badge';
	}
</script>

<section class="section user-list">
	<header class="section-head">
		<h3 class="section-title">Users <span class="section-count">{$users.length}</span></h3>
		<input class="input" type="text" placeholder="Search users..." bind:value={search} />
	</header>
	<div class="list">
		{#each filtered as user}
			<div class="row">
				<Tooltip text={user.id || ''} placement="top">
					<span class="jid" aria-label="User JID">{maskJid(user.id || '')}</span>
				</Tooltip>
				<span class={roleClass(user.role)}>{user.role || 'FREE'}</span>
				<span class="limit">{user.limit ?? '—'}</span>
			</div>
		{/each}
		{#if !filtered.length}
			<p class="empty">No users found.</p>
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
		grid-template-columns: 1fr auto auto;
		align-items: center;
		padding: 0.45rem 0.4rem;
		gap: var(--space-3);
		border-radius: var(--radius-sm);
		transition: background var(--tx-base);
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
		min-width: 2rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.input {
		max-width: 220px;
	}

	@media (max-width: 540px) {
		.input {
			max-width: 100%;
			flex: 1;
		}
	}
</style>
