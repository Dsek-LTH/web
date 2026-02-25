<script lang="ts">
	import * as m from "$paraglide/messages";
</script>

<a
	class="pop-out bg-base-300 flex gap-6 rounded-2xl px-6 py-3"
	href="https://link.dsek.se/srd"
	target="_blank"
	rel="noreferrer noopener"
>
	<span class="i-mdi-pencil text-secondary lg:text-primary self-center text-2xl"
	></span>

	<article>
		<p>{m.home_feedbackSRD()}</p>
		<h2 class="text-secondary lg:text-primary text-xl font-bold">
			{m.home_contactSRD()}
		</h2>
	</article>
</a>
