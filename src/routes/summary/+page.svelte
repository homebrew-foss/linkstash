<script lang="ts">
	import { Effect } from 'effect'
	import Header from '#lib/components/Header.svelte'

	type SummaryItem = {
		id?: string
		url?: string
		title?: string
		name?: string
		domain?: string
		roomComment?: string
		ts?: number
		count?: number
		meta?: Record<string, any>
	}

	type RoomStat = {
		name: string
		total: number
	}

	type SummaryResponse = {
		from: string | null
		to: string | null
		room: string | null
		total: number
		rooms: RoomStat[]
		summary: SummaryItem[]
	}

	class SummaryError extends Error {
		constructor(message: string) {
			super(message)
			this.name = "SummaryError"
		}
	}

	function toIsoDay(d: Date) {
		return d.toISOString().slice(0, 10)
	}

	// All dates are handled in UTC (T00:00:00Z) so the range label and the
	// calendar grid never disagree across DST / timezone boundaries.
	function formatRange(from: string | null, to: string | null): string {
		if (!from || !to) return 'Latest activity'
		const fromDate = new Date(`${from}T00:00:00Z`)
		const toDate = new Date(`${to}T00:00:00Z`)
		const fromLabel = fromDate.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
		const toLabel = toDate.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
		return from === to ? fromLabel : `${fromLabel} to ${toLabel}`
	}

	function formatLongDay(day: string): string {
		const d = new Date(`${day}T00:00:00Z`)
		return d.toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	}

	function buildDayRange(from: string | null, to: string | null): string[] {
		if (!from || !to) return []
		const start = new Date(`${from}T00:00:00Z`)
		const end = new Date(`${to}T00:00:00Z`)
		const out: string[] = []
		for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
			out.push(d.toISOString().slice(0, 10))
		}
		return out;
	}

	function dayKeyFromTs(ts: number | undefined): string {
		if (!ts) return ''
		return new Date(ts).toISOString().slice(0, 10)
	}

	function roomName(item: SummaryItem): string {
		return (item.roomComment || '').trim() || 'Unknown'
	}

	const fetchSummary = (params: {
		from: string
		to: string
		room: string
	}) =>
		Effect.gen(function* () {
			const controller = new AbortController()

			const url = new URL("/api/summary", window.location.origin)
			if (params.from) url.searchParams.set("from", params.from)
			if (params.to) url.searchParams.set("to", params.to)
			if (params.room) url.searchParams.set("room", params.room)

			const res = yield* Effect.promise(() =>
				fetch(url.toString(), { signal: controller.signal })
			)
			if (!res.ok) throw new SummaryError(`Failed to load summary (${res.status})`)
			return yield* Effect.promise(() => res.json())
		})

	function buildCalendarUrl(params: {
		from: string
		to: string
		room: string
	}): string {
		const qp = new URLSearchParams()
		if (params.from) qp.set("from", params.from)
		else qp.delete("from")
		if (params.to) qp.set("to", params.to)
		else qp.delete("to")
		qp.delete("day")
		if (params.room) qp.set("room", params.room)
		else qp.delete("room")
		const next = qp.toString()
		return `/summary${next ? `?${next}` : ""}`
	}

	function calendarOffset(days: string[]): number {
		if (days.length === 0) return 0
		return new Date(`${days[0]}T00:00:00Z`).getUTCDay()
	}

	function getIntensity(count: number, max: number): number {
		if (count === 0) return 0
		if (count >= max * 0.8) return 4
		if (count >= max * 0.55) return 3
		if (count >= max * 0.3) return 2
		return 1
	}

	function getIntensityColor(intensity: number): string {
		if (intensity === 0) return 'transparent'
		const alpha = 0.1 + intensity * 0.2
		return `rgba(80, 156, 147, ${alpha})`
	}

	let from = $state('')
	let to = $state('')
	let room = $state('')
	let query = $state('')
	let selectedDay = $state('')
	let userPickedDay = $state(false)

	let data = $state<SummaryResponse | null>(null)
	let loading = $state(true)
	let error = $state<string | null>(null)

	// Initialise filter state from the URL on mount. Runs once; it only writes
	// state, never reads it reactively, so it won't re-run on state changes.
	$effect(() => {
		if (typeof window === 'undefined') return
		const params = new URLSearchParams(window.location.search)
		const initialDay = params.get('day') || ''
		const initialFrom = params.get('from') || ''
		const initialTo = params.get('to') || ''
		const initialRoom = params.get('room') || ''
		from = initialDay ? initialDay : initialFrom
		to = initialDay ? initialDay : initialTo
		room = initialRoom
	})

	// Re-fetch whenever the range or room filter changes. `query` is deliberately
	// NOT tracked here — it only filters client-side, so keystrokes must not
	// refetch. Cancellation handled by AbortController: cleanup aborts the fetch.
	let abortController: AbortController | null = null

	$effect(() => {
		void from
		void to
		void room

		loading = true
		error = null

		abortController?.abort()
		abortController = new AbortController()

		Effect.runPromise(fetchSummary({ from, to, room })).then((payload) => {
			if (abortController?.signal.aborted) return
			data = payload
			window.history.replaceState(null, '', buildCalendarUrl({ from, to, room }))
			loading = false
		}).catch((err) => {
			if (abortController?.signal.aborted) return
			const e = err as Error
			error = e instanceof SummaryError ? e.message : 'Unable to load summary'
			loading = false
		})

		return () => {
			abortController?.abort()
		}
	})

	const filtered = $derived.by(() => {
		const list = data?.summary || []
		if (!query.trim()) return list
		const q = query.trim().toLowerCase()
		return list.filter((item) => {
			const title = (item.title || item.name || item.meta?.title || '').toLowerCase()
			const domain = (item.domain || item.meta?.domain || '').toLowerCase()
			const url = (item.url || item.meta?.url || '').toLowerCase()
			const roomText = roomName(item).toLowerCase()
			return (
				title.includes(q) ||
				domain.includes(q) ||
				url.includes(q) ||
				roomText.includes(q)
			)
		})
	})

	// Total votes across the whole range (not just the search subset).
	const totalVotes = $derived(
		(data?.summary || []).reduce((acc, item) => acc + (item.count || 0), 0)
	)

	const activeRoomLabel = $derived(room || 'All rooms')

	const calendarDays = $derived(
		buildDayRange(data?.from || from || null, data?.to || to || null)
	)

	const countsByDay = $derived.by(() => {
		const counts = new Map<string, number>()
		for (const item of filtered) {
			const day = dayKeyFromTs(item.ts)
			if (!day) continue
			counts.set(day, (counts.get(day) || 0) + 1)
		}
		return counts
	})

	const maxDayCount = $derived.by(() => {
		let max = 0
		for (const value of countsByDay.values()) {
			if (value > max) max = value
		}
		return max || 1
	})

	// Auto-select the last active day on load / range change, but never clobber
	// a day the user explicitly picked unless it falls out of the new range.
	$effect(() => {
		const days = calendarDays
		if (days.length === 0) {
			selectedDay = ''
			userPickedDay = false
			return
		}
		if (!selectedDay || !countsByDay.has(selectedDay)) {
			if (!userPickedDay) {
				selectedDay = days[days.length - 1]
			} else {
				selectedDay = ''
			}
		}
	})

	const selectedDayLinks = $derived.by(() => {
		if (!selectedDay) return filtered
		return filtered.filter((item) => dayKeyFromTs(item.ts) === selectedDay)
	})

	function pickDay(day: string) {
		selectedDay = day
		userPickedDay = true
	}

	function resetFilters() {
		from = ''
		to = ''
		query = ''
		userPickedDay = false
	}
</script>

<svelte:head>
	<title>Summary – linkstash</title>
</svelte:head>

<Header />

<main class="app-main" id="main-content">
	<div class="summary">
		<h1>Summary</h1>
		<p class="subtitle">{formatRange(data?.from || from || null, data?.to || to || null)}</p>

		<div class="summary-form">
			<input
				type="date"
				class="admin-input"
				bind:value={from}
				max={toIsoDay(new Date())}
			/>
			<input
				type="date"
				class="admin-input"
				bind:value={to}
				min={from || undefined}
				max={toIsoDay(new Date())}
			/>
			<input
				type="text"
				class="admin-input"
				bind:value={query}
				placeholder="Search title, domain, URL, room"
			/>
			<button class="admin-btn" onclick={resetFilters}>Reset</button>
		</div>

		<div class="room-filter">
			<button
				type="button"
				class="admin-btn room-filter-btn"
				class:active={room === ''}
				aria-pressed={room === ''}
				onclick={() => (room = '')}
			>
				All rooms
			</button>
			{#each data?.rooms || [] as roomItem (roomItem.name)}
				<button
					type="button"
					class="admin-btn room-filter-btn"
					class:active={roomItem.name === room}
					aria-pressed={roomItem.name === room}
					onclick={() => (room = roomItem.name)}
				>
					{roomItem.name} ({roomItem.total})
				</button>
			{/each}
		</div>

		<div class="summary-stats">
			<div class="summary-stat">
				<div class="summary-stat-value">{filtered.length}</div>
				<div class="summary-stat-label">links shown</div>
			</div>
			<div class="summary-stat">
				<div class="summary-stat-value">{totalVotes}</div>
				<div class="summary-stat-label">total votes</div>
			</div>
			<div class="summary-stat">
				<div class="summary-stat-value">{activeRoomLabel}</div>
				<div class="summary-stat-label">active room filter</div>
			</div>
		</div>

		<div class="calendar-section">
			<h3 class="calendar-heading">Calendar view</h3>
			<p class="calendar-subtitle">
				{selectedDay ? formatLongDay(selectedDay) : 'Select a day with activity'}
			</p>

			<div class="calendar-weekdays">
				<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
			</div>

			<div class="calendar-grid">
				{#each Array(calendarOffset) as _, idx (idx)}
					<div></div>
				{/each}

				{#each calendarDays as day (day)}
					{@const count = countsByDay.get(day) || 0}
					{@const intensity = getIntensity(count, maxDayCount)}
					<button
						type="button"
						class="calendar-day"
						class:selected={selectedDay === day}
						onclick={() => pickDay(day)}
						title="{day}: {count} links"
						style:background={getIntensityColor(intensity)}
					>
						<span class="calendar-day-number">{new Date(`${day}T00:00:00Z`).getUTCDate()}</span>
						<span class="calendar-day-count">{count > 0 ? count : ''}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="summary-list-section">
			{#if loading}
				<div class="loading">Loading summary...</div>
			{:else if error}
				<div class="error">{error}</div>
			{:else if selectedDayLinks.length === 0}
				<div class="empty">No links match this filter.</div>
			{:else}
				<ul class="linklist">
					{#each selectedDayLinks as item, idx (item.id || `${item.url}-${idx}`)}
						{@const url = item.url || item.meta?.url || '#'}
						{@const title = item.title || item.name || item.meta?.title || url}
						{@const domain = item.domain || item.meta?.domain || ''}
						<li class="linklist-item">
							<div class="link-row">
								<div class="link-main">
									<a
										class="link-title"
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										>{title}</a
									>
									<div class="link-meta">
										<span class="link-domain">{domain}</span>
										<span class="link-room">{roomName(item)}</span>
										{#if item.count}<span class="link-votes">{item.count} votes</span>{/if}
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<p class="summary-back">
			<a href="/" class="summary-back-link">Back to feed</a>
		</p>
	</div>
</main>
