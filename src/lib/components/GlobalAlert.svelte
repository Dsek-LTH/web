<script lang="ts">
	import { marked } from "marked";
	import DOMPurify from "isomorphic-dompurify";
	import { invalidate } from "$app/navigation";

	export let id: string;
	export let message: string;
	export let severity: string;

	const icon = (() => {
		switch (severity) {
			case "info":
				return "i-mdi-information-outline";
			case "success":
				return "i-mdi-check-circle-outline";
			case "warning":
				return "i-mdi-alert-outline";
			case "error":
				return "i-mdi-close-circle-outline";
		}
	})();
</script>

<div role="alert" class={`alert alert-${severity} gap-1 rounded-none`}>
	<span class={`${icon} text-xl`}></span>
	<span class="prose-a:link font-bold">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
		{@html marked(DOMPurify.sanitize(message))}
	</span>
	<form
		method="POST"
		action="/api/closeAlert"
		class="border-opacity-20 h-7 w-20 border-t-[1.5px] border-black sm:h-[unset] sm:w-7 sm:border-0"
		on:submit={(e) => {
			e.preventDefault();
			const ACTION_URL = "/api/closeAlert";
			const formData = new FormData(e.currentTarget);
			const data = new URLSearchParams();
			for (let field of formData) {
				const [key, value] = field;
				if (typeof value === "string") {
					data.append(key, value);
				}
			}
			fetch(ACTION_URL, {
				method: "POST",
				body: data,
			}).then(() => invalidate("alerts"));
		}}
	>
		<button
			class="mt-1 aspect-square h-7 w-7 rounded-lg bg-transparent font-black transition hover:bg-white/20 sm:mt-0"
		>
			✕
		</button>
		<input type="hidden" name="alertId" value={id} />
	</form>
</div>
