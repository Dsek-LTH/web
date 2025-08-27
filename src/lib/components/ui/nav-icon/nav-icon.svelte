<script lang="ts">
  import { twMerge } from "tailwind-merge";
  import DsekLogo from "../../DsekLogo.svelte";
  export let icon: string;
  let clazz = "";
  export { clazz as class };
</script>

{#if icon === "dsek-icon"}
  <DsekLogo class={twMerge("text-primary size-4", clazz)} />
{:else}
  <span class={twMerge(`${icon} text-primary size-5`, clazz)}></span>
{/if}
