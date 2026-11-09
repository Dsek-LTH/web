<script lang="ts">
  import dayjs from "dayjs";
  import "@schedule-x/theme-default/dist/index.css";
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { getFlash } from "sveltekit-flash-message";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { getLocale } from "$paraglide/runtime";
  import { toast } from "$lib/stores/toast";
  import { page } from "$app/state";
  import * as messages from "$paraglide/messages";
  import ParticleRain from "$lib/components/ParticleRain.svelte";
  import { BIRTHDAY_COLORS } from "$lib/utils/birthdays";

  const { children, data } = $props();

  dayjs.locale(getLocale());
  let pageTitle = writable(messages.the_d_guild());
  setContext("pageTitle", pageTitle);
  const flash = getFlash(page);
  $effect(() => {
    if ($flash) {
      toast($flash.message, $flash.type, $flash.id);
    }
  });
</script>

<ModeWatcher />
{#if data.seasonalEffect === "snow"}
  <ParticleRain
    content="❅"
    colors={["#ffffff", "#bfdbfe"]}
    count={45}
    minSize={10}
    maxSize={22}
    minDuration={8}
    maxDuration={16}
    drift={80}
  />
{:else if data.seasonalEffect === "clover"}
  <ParticleRain
    content="🍀"
    count={30}
    minSize={12}
    maxSize={20}
    minDuration={7}
    maxDuration={13}
    drift={100}
  />
{:else if data.seasonalEffect === "darts"}
  <ParticleRain
    content="➶"
    colors={["#f280a1", "#9966cc", "#111827"]}
    count={35}
    minSize={14}
    maxSize={24}
    minDuration={6}
    maxDuration={12}
    drift={140}
  />
{/if}
{#if data.isBirthday}
  <ParticleRain colors={BIRTHDAY_COLORS} />
{/if}
<svelte:head>
  {#if data.isApp}
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
  {/if}

  <meta name="description" content={messages.meta_description()} />
</svelte:head>

{@render children?.()}
