<script lang="ts">
	import { twMerge } from "tailwind-merge";
	import DsekLogo from "./DsekLogo.svelte";
	export let icon: string;
	let clazz = "";
	export { clazz as class };
</script>

{#if icon === "dsek-icon"}
	<DsekLogo class={twMerge("text-primary size-6", clazz)} />
{:else}
	<span class={twMerge(`${icon} text-primary size-6`, clazz)}></span>
{/if}
