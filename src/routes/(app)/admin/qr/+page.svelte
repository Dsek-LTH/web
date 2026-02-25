<script lang="ts">
	import { enhance } from "$app/forms";
	import PageHeader from "$lib/components/nav/PageHeader.svelte";
	import { getFileUrl } from "$lib/files/client";
	import * as m from "$paraglide/messages";
	import { relativeDate } from "$lib/utils/client/datetime";
	import { page } from "$app/stores";
	import { goto } from "$lib/utils/redirect";

	let { data } = $props();

	// Local filtering
	let searchTerm = $state("");
	let filteredEvents = $derived.by(() => {
		if (!searchTerm) return data.events;
		const term = searchTerm.toLowerCase();
		return data.events.filter(
			(event) =>
				event.title.toLowerCase().includes(term) ||
				event.description?.toLowerCase().includes(term) ||
				event.location?.toLowerCase().includes(term),
		);
	});

	// Pagination functions
	const goToPage = (pageNum: number) => {
		const url = new URL($page.url);
		url.searchParams.set("page", pageNum.toString());
		goto(url.pathname + url.search);
	};

	const PAGES_TO_SHOW = 3;

	let paginationInfo = $derived.by(() => {
		if (!data || !data.pagination) {
			return {
				displayPages: [],
				showFirstButton: false,
				showLastButton: false,
				showPrevEllipsis: false,
				showNextEllipsis: false,
			};
		}

		const currentPage = data.pagination.currentPage;
		const totalPages = data.pagination.totalPages;

		if (totalPages <= PAGES_TO_SHOW) {
			return {
				displayPages: Array.from({ length: totalPages }, (_, i) => i + 1),
				showFirstButton: false,
				showLastButton: false,
				showPrevEllipsis: false,
				showNextEllipsis: false,
			};
		}

		const half = Math.floor(PAGES_TO_SHOW / 2);
		let startPage: number;
		let endPage: number;

		if (currentPage <= half + 1) {
			startPage = 1;
			endPage = PAGES_TO_SHOW;
		} else if (currentPage >= totalPages - half) {
			endPage = totalPages;
			startPage = totalPages - PAGES_TO_SHOW + 1;
		} else {
			startPage = currentPage - half;
			endPage = currentPage + (PAGES_TO_SHOW % 2 === 0 ? half - 1 : half);
		}
		return {
			displayPages: Array.from(
				{ length: endPage - startPage + 1 },
				(_, i) => startPage + i,
			),
			showFirstButton: startPage > 1,
			showPrevEllipsis: startPage > 2,
			showLastButton: endPage < totalPages,
			showNextEllipsis: endPage < totalPages - 1,
		};
	});
</script>

<PageHeader title="Event QR Scanner" />

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<div class="w-full max-w-md">
			<input
				type="text"
				bind:value={searchTerm}
				placeholder="Search events..."
				class="input input-bordered w-full"
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each filteredEvents as event (event.id)}
			<div class="card bg-base-200 shadow-xl transition-all hover:shadow-2xl">
				<figure class="relative h-40 w-full">
					{#if event.imageUrl}
						<img
							src={getFileUrl(event.imageUrl)}
							alt={event.title}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div
							class="bg-primary/10 flex h-full w-full items-center justify-center"
						>
							<span class="i-mdi-calendar text-primary text-4xl"></span>
						</div>
					{/if}
					{#if event.isCancelled}
						<div
							class="bg-base-100/80 absolute inset-0 flex items-center justify-center"
						>
							<span class="badge badge-error badge-lg font-bold"
								>{m.events_cancelled()}</span
							>
						</div>
					{/if}
				</figure>
				<div class="card-body">
					<h2 class="card-title">
						{event.title}
						{#if event.tags && event.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each event.tags.slice(0, 2) as tag}
									<span class="badge badge-sm">{tag.name}</span>
								{/each}
								{#if event.tags.length > 2}
									<span class="badge badge-sm">+{event.tags.length - 2}</span>
								{/if}
							</div>
						{/if}
					</h2>

					<div class="flex items-center gap-2 text-sm">
						<span class="i-mdi-calendar mr-1"></span>
						<time datetime={event.startDatetime.toISOString()}>
							{relativeDate(event.startDatetime)}
							{event.startDatetime.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</time>
					</div>

					{#if event.location}
						<div class="flex items-center gap-2 text-sm">
							<span class="i-mdi-map-marker mr-1"></span>
							<span>{event.location}</span>
						</div>
					{/if}

					<div class="flex items-center gap-2 text-sm">
						<span class="i-mdi-account-group mr-1"></span>
						<span>{event.going.length} {m.events_going_members()}</span>
					</div>

					<div class="card-actions mt-auto pt-4">
						<form
							method="POST"
							action="?/selectEvent"
							use:enhance
							class="w-full"
						>
							<input type="hidden" name="eventSlug" value={event.slug} />
							<button type="submit" class="btn btn-primary w-full">
								<span class="i-mdi-qrcode-scan mr-1 text-current"></span>
								{m.events_select_button()}
							</button>
						</form>
					</div>
				</div>
			</div>
		{:else}
			<div class="col-span-full rounded-lg bg-base-200 p-8 text-center">
				<p class="text-lg font-medium">{m.events_no_events_found()}</p>
				<p class="mt-2 text-sm opacity-70">{m.events_change_search_term()}</p>
			</div>
		{/each}
	</div>

	<!-- Pagination controls -->
	{#if !searchTerm && data.pagination && data.pagination.totalPages > 1}
		<div class="join mt-6 self-center">
			<!-- Previous page button -->
			<button
				class="btn join-item"
				disabled={!data.pagination.hasPrevPage}
				onclick={() => goToPage(data.pagination.currentPage - 1)}
			>
				«
			</button>

			<!-- First page button -->
			{#if paginationInfo.showFirstButton}
				<button class="btn join-item" onclick={() => goToPage(1)}>1</button>
			{/if}

			<!-- Previous ellipsis -->
			{#if paginationInfo.showPrevEllipsis}
				<button class="btn btn-disabled join-item">...</button>
			{/if}

			<!-- Page number buttons -->
			{#each paginationInfo.displayPages as pageNum (pageNum)}
				<button
					class="btn join-item {pageNum === data.pagination.currentPage
						? 'btn-active'
						: ''}"
					onclick={() => goToPage(pageNum)}
				>
					{pageNum}
				</button>
			{/each}

			<!-- Next ellipsis -->
			{#if paginationInfo.showNextEllipsis}
				<button class="btn btn-disabled join-item">...</button>
			{/if}

			<!-- Last page button -->
			{#if paginationInfo.showLastButton}
				<button
					class="btn join-item"
					onclick={() => goToPage(data.pagination.totalPages)}
				>
					{data.pagination.totalPages}
				</button>
			{/if}

			<!-- Next page button -->
			<button
				class="btn join-item"
				disabled={!data.pagination.hasNextPage}
				onclick={() => goToPage(data.pagination.currentPage + 1)}
			>
				»
			</button>
		</div>

		<div class="text-base-content/70 mt-2 self-center text-sm">
			{m.events_pagination_info({
				currentPage: data.pagination.currentPage,
				totalPages: data.pagination.totalPages,
				totalEvents: data.pagination.totalEvents,
			})}
		</div>
	{/if}
</div>
