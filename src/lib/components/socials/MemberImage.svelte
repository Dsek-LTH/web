<script lang="ts">
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let member: Pick<ExtendedPrismaModel<"Member">, "picturePath">;
	export let lazy = false;
</script>

<img
	src={member.picturePath || "https://gravatar.com/avatar?s=100&d=mp"}
	on:error|preventDefault={(e) => {
		const imgElement = e.currentTarget;
		if (
			imgElement &&
			"src" in imgElement &&
			imgElement.src !== "https://gravatar.com/avatar?s=100&d=mp"
		) {
			imgElement.src = "https://gravatar.com/avatar?s=100&d=mp";
		}
	}}
	alt="Member avatar"
	loading={lazy ? "lazy" : "eager"}
/>
