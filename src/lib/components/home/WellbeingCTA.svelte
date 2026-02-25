<script lang="ts">
	import * as m from "$paraglide/messages";

	let { wellbeing }: { wellbeing: string } = $props();
</script>

<a
	class="pop-out bg-base-300 flex gap-6 rounded-2xl px-6 py-3"
	href="https://bit.ly/trivselkontakt"
	target="_blank"
	rel="noreferrer noopener"
>
	<span class="i-mdi-speak text-secondary lg:text-primary self-center text-2xl"
	></span>

	<article>
		<p>{wellbeing}</p>
		<h2 class="text-secondary lg:text-primary text-xl font-bold">
			{m.home_contactWellbeing()}
		</h2>
	</article>
</a>
