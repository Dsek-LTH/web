<script lang="ts">
	import type { SongSearchReturnAttributes } from "$lib/search/searchTypes";

	export let song: SongSearchReturnAttributes;
</script>

<li>
	<a
		href={"/songbook/" + song.slug}
		class="search-result focus:border-primary border border-transparent"
	>
		<div class="avatar aspect-square w-8 overflow-hidden rounded-full">
			<span class="i-mdi-music text-2xl"></span>
		</div>
		<div>
			<h4>{song.title}</h4>
			<p class="line-clamp-1 text-gray-500">
				{song.lyrics}
			</p>
		</div>
	</a>
</li>
