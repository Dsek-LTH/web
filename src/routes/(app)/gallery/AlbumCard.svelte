<script lang="ts">
	import * as m from "$paraglide/messages";
	let { album } = $props();
</script>

<a href={"./gallery/album/" + album[0]}
	><div class="card bg-base-300 shadow-sm">
		<figure class="relative">
			<div
				class="bg-base-300 hover:bg-opacity-70 absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-all group-hover:opacity-100 hover:opacity-100 md:opacity-0"
			>
				<span class="link text-neutral-content text-lg hover:opacity-100"
					>{m.gallery_show_pictures()}</span
				>
			</div>
			<img src={album[1][0]?.thumbnailUrl} alt="Album display" />
		</figure>
		<div class="card-body pt-5">
			<h2 class="card-title text-2xl">{album[0].split(/ (.*)/s)[1]}</h2>
			<div class="space-between flex flex-row">
				<p>{album[0].split(" ")[0]}</p>
				<p class="text-right">
					{album[1].length}
					{album[1].length > 1 ? m.gallery_pictures() : m.gallery_picture()}
				</p>
			</div>
		</div>
	</div>
</a>
