<script lang="ts">
  import { REVEAL_LAUNCH_DATE } from "$lib/components/postReveal/types";
  import { goto } from "$lib/utils/redirect";
  import { colors } from "$lib/utils/themes";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  // eslint-disable-next-line no-restricted-imports -- eh what the hell why not
  import logo25 from "../(nollning)/nollning/(photos)/logo25.svg";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  onMount(() => {
    goto(data.redirect, {
      replaceState: true,
    });
  });
  const revealTheme = REVEAL_LAUNCH_DATE <= new Date();
  let background = $derived(
    data.redirect === "/nollning" && revealTheme
      ? colors.nollningPostReveal["base-100"]
      : "#f280a1",
  );
</script>

<div
  class="relative h-dvh w-dvw"
  style="background-color: {background}"
  out:fade
>
  {#if data.redirect === "/nollning" && revealTheme}
    <!-- TODO: Replace with nollnings logo -->
    <div
      class="absolute left-1/2 top-1/2 size-60 max-h-[50%] max-w-[50%] -translate-x-1/2 -translate-y-1/2 md:size-80"
    >
      <img
        src={logo25}
        class="absolute inset-0 animate-scale-fade"
        alt="Nollning logo spinning"
      />
    </div>
  {:else}
    <img
      src="/d-white.webp"
      alt="D-sek logo"
      class="absolute left-1/2 top-1/2 max-h-[50%] max-w-[50%] -translate-x-1/2 -translate-y-1/2"
    />
  {/if}
</div>
