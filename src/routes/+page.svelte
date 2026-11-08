<script lang="ts">
	import LinksClient from '#lib/components/LinksClient.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main class="app-main" id="main-content">
	<LinksClient initialPage={data.page} />
</main>
