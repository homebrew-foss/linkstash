<script lang="ts">
	/**
	 * Skeleton placeholder rows that mirror a real LinkItem row.
	 * Shimmer animation gives feedback that content is loading.
	 */

	let { count = 5 }: { count?: number } = $props();

	const rows = $derived.by(() => Array.from({ length: count }));
</script>

<ol class="hn-list skeleton-list" role="status" aria-label="Loading links">
	{#each rows as _, i (i)}
		<li class="linklist-item skeleton-item">
			<div class="link-row">
				<span class="rank skeleton-rank" aria-hidden="true"></span>
				<div class="link-main">
					<div class="skeleton-title skeleton-line short"></div>
					<div class="skeleton-meta">
						<div class="skeleton-line"></div>
						<div class="skeleton-line tiny"></div>
					</div>
				</div>
			</div>
		</li>
	{/each}
</ol>

<style>
	.skeleton-list {
		list-style: none;
		margin: 0;
		padding: 2px 4px 6px;
	}

	.skeleton-item {
		padding: 0;
		border: none;
		margin-bottom: 4px;
		display: flex;
		min-height: 36px;
		align-items: center;
	}

	.link-row {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
	}

	.skeleton-rank {
		color: transparent;
		background: #e8e8db;
		width: 1.4rem;
		text-align: right;
		flex-shrink: 0;
		border-radius: 0;
	}

	.skeleton-line {
		background: linear-gradient(
			90deg,
			#e8e8db 25%,
			#f6f6ef 37%,
			#e8e8db 63%
		);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.4s ease-in-out infinite;
		border-radius: 0;
		margin-bottom: 3px;
		height: 16px;
	}

	.skeleton-line.short {
		width: 60%;
	}

	.skeleton-line.tiny {
		width: 40%;
	}

	.skeleton-title {
		font-size: 10pt;
		min-height: 1.3em;
		margin-bottom: 4px;
		flex: 1;
	}

	.skeleton-meta {
		font-size: 7pt;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	@keyframes skeleton-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>