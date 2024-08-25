<script lang="ts">
  import { REVEAL_LAUNCH_DATE } from "$lib/components/postReveal/types";
  import { goto } from "$lib/utils/redirect";
  import { colors } from "$lib/utils/themes";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let data;
  onMount(() => {
    goto(data.redirect, {
      replaceState: true,
    });
  });
  const revealTheme = REVEAL_LAUNCH_DATE <= new Date();
  $: background =
    data.redirect === "/nollning" && revealTheme
      ? colors.nollningPostReveal["base-100"]
      : "#f280a1";
</script>

<div
  class="relative h-dvh w-dvw"
  style="background-color: {background}"
  out:fade
>
  {#if data.redirect === "/nollning" && revealTheme}
    <!-- TODO: Replace with nollnings logo -->
    <img
      src="/d-white.webp"
      alt="D-sek logo"
      class="absolute left-1/2 top-1/2 max-h-[50%] max-w-[50%] -translate-x-1/2 -translate-y-1/2"
    />
  {:else}
    <img
      src="/d-white.webp"
      alt="D-sek logo"
      class="absolute left-1/2 top-1/2 max-h-[50%] max-w-[50%] -translate-x-1/2 -translate-y-1/2"
    />
  {/if}
</div>
