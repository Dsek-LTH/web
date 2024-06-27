<script lang="ts">
  import DsekLogo from "./DsekLogo.svelte";
  export let icon: string;
</script>

{#if icon === "dsek-icon"}
  <DsekLogo className="size-6 text-primary" />
{:else}
  <span class={`${icon} size-6 text-primary`} />
{/if}
