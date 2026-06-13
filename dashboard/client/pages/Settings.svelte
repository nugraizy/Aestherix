<script>
	import PrefixConfig from '../components/PrefixConfig.svelte';
	import SettingsForm from '../components/SettingsForm.svelte';
	import UserList from '../components/UserList.svelte';
</script>

<div class="settings">
	<header class="page-head">
		<h2><i class="nf nf-fa-gear"></i> Settings</h2>
		<p class="page-sub">Bot configuration, prefix, and user limits.</p>
	</header>

	<SettingsForm />
	<PrefixConfig />
	<UserList />
</div>

<style>
	.settings {
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
</style>
