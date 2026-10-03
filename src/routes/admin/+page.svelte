<script lang="ts">
	import AdminClient from '$lib/components/AdminClient.svelte';
	import Header from '$lib/components/Header.svelte';
</script>

<svelte:head>
	<title>Admin – linkstash</title>
</svelte:head>

<Header />

<main class="app-main" id="main-content">
	<AdminClient />
</main>
