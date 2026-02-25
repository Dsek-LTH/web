<script lang="ts">
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let customAuthor: Pick<
		ExtendedPrismaModel<"CustomAuthor">,
		"imageUrl" | "name"
	> | null;
</script>

<img
	src={customAuthor?.imageUrl ?? "https://gravatar.com/avatar?s=100&d=mp"}
	alt={customAuthor?.name ?? "Unknown"}
	on:error={(e) => {
		const imgElement = e.currentTarget;
		if (
			imgElement &&
			"src" in imgElement &&
			imgElement.src !== "https://gravatar.com/avatar?s=100&d=mp"
		) {
			imgElement.src = "https://gravatar.com/avatar?s=100&d=mp";
		}
	}}
/>
