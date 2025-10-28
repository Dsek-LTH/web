<script lang="ts">
  import { type IMinecraftData } from "minecraft-server-ping";
  import * as m from "$paraglide/messages";

  let { minecraftStatus }: { minecraftStatus: Promise<IMinecraftData | null> } =
    $props();
  let badge_type: "badge-error" | "badge-success" | "badge-warning" =
    $state("badge-warning");
  minecraftStatus
    .then((status) => (badge_type = status ? "badge-success" : "badge-error"))
    .catch(() => (badge_type = "badge-error"));
</script>

<div
  class="flex-col justify-between gap-2 rounded-t-2xl bg-base-300 max-md:flex-col md:flex-1"
>
  <div class="flex w-full flex-row overflow-hidden rounded-t-2xl">
    {#snippet minecraft_border()}
      <svg class="-mr-px w-full fill-primary" viewBox="0 0 4.2333333 1.0583333">
        <path
          id="rect17"
          style="fill-opacity:1;stroke:#000000;stroke-width:0"
          d="M 0 0 L 0 0.26458333 L 0 0.52916667 L 0 0.79375 L 0.26458333 0.79375 L 0.26458333 0.52916667 L 0.52916667 0.52916667 L 0.52916667 0.79375 L 1.0583333 0.79375 L 1.0583333 1.0583333 L 1.3229167 1.0583333 L 1.3229167 0.79375 L 1.3229167 0.52916667 L 1.3229167 0.26458333 L 1.5875 0.26458333 L 1.5875 0.52916667 L 1.5875 0.79375 L 1.8520833 0.79375 L 1.8520833 0.52916667 L 2.1166667 0.52916667 L 2.1166667 0.79375 L 2.1192505 0.79375 L 2.1192505 1.0583333 L 2.3838338 1.0583333 L 2.3838338 0.79375 L 2.6458333 0.79375 L 2.6458333 1.0583333 L 2.9104167 1.0583333 L 2.9104167 0.79375 L 3.175 0.79375 L 3.175 0.52916667 L 3.4395833 0.52916667 L 3.4395833 0.79375 L 3.96875 0.79375 L 3.96875 0.52916667 L 4.2333333 0.52916667 L 4.2333333 0.26458333 L 4.2333333 0 L 0.26458333 0 L 0 0 z "
        />
      </svg>
    {/snippet}
    <!-- TIL, Svelte can iterate over every object as long as it contains a length field -->
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each { length: 7 } as _}
      {@render minecraft_border()}
    {/each}
  </div>
  <div class="w-full p-4">
    <a
      href="https://whitelist.dsek.se"
      class="text-xl font-bold hover:underline">Minecraft Server</a
    >
    <div class="inline-flex h-3">
      <div
        class="badge badge-xs transition-colors duration-500 {badge_type} absolute ml-2 gap-2"
      ></div>
    </div>
  </div>
</div>
<div class="flex h-full flex-col justify-between rounded-b-xl bg-base-200 p-4">
    {m.minecraft_server_description()}
  <div class="flex w-full justify-around">
    <a class="btn btn-ghost btn-sm" href="https://dynmap.dsek.se"
      ><span class="i-mdi-map text-lg text-primary"></span>{m.minecraft_dynmap()}</a
    ><a class="btn btn-ghost btn-sm" href="https://whitelist.dsek.se"
      ><span class="i-mdi-playlist-add text-lg text-primary"></span>{m.minecraft_join_prompt()}</a
    >
  </div>
  <div class="m-2 flex flex-row justify-center rounded-xl bg-base-300 p-3">
    <span class="font-bold"
      >{#await minecraftStatus}
        <p>?</p>
      {:then status}
        {#if status}
          {status.players.online}
        {:else}
          <p>-</p>
        {/if}
      {:catch}
        <p>-</p>
      {/await}</span
    >
    &nbsp;{m.minecraft_players_online()}
  </div>
</div>
