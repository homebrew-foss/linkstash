<script lang="ts">
	import '../app.css';
	import CommandPalette from '#lib/components/CommandPalette.svelte';
	import ServiceWorkerRegister from '#lib/components/ServiceWorkerRegister.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
<CommandPalette />
<ServiceWorkerRegister />
