<script lang="ts">
  import { twMerge } from "tailwind-merge";
  import DsekLogo from "./DsekLogo.svelte";
  interface Props {
    icon: string;
    class?: string;
  }

  let { icon, class: clazz = "" }: Props = $props();
</script>

{#if icon === "dsek-icon"}
  <DsekLogo class={twMerge("size-6 text-primary", clazz)} />
{:else}
  <span class={twMerge(`${icon} size-6 text-primary`, clazz)}></span>
{/if}
