<script lang="ts">
  import { type IMinecraftData } from "minecraft-server-ping";

  let { minecraftStatus }: { minecraftStatus: IMinecraftData | null } =
    $props();
</script>

<div
  class="flex-col justify-between gap-2 bg-base-300 max-md:flex-col md:flex-1"
>
  <div class="flex w-full flex-row overflow-hidden rounded-2xl">
    {#snippet minecraft_border()}
      <svg class="w-full fill-primary" viewBox="0 0 4.2333333 1.0583333">
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
    {#if !minecraftStatus}
      <div class="badge badge-error ml-2 gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block h-4 w-4 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </div>
    {/if}
  </div>
</div>
<div class="flex h-full flex-col justify-between rounded-b-xl bg-base-200 p-4">
  Gå med i Sektionents Minecraft Server, delad med F-sektionen! För att kunna gå
  med måste du registrera dig nedan.
  <div class="flex w-full justify-around">
    <a class="btn btn-ghost btn-sm" href="https://dynmap.dsek.se"
      ><span class="i-mdi-map text-lg text-primary"></span>Dynmap</a
    ><a class="btn btn-ghost btn-sm" href="https://whitelist.dsek.se"
      ><span class="i-mdi-playlist-add text-lg text-primary"></span>Join Now!</a
    >
  </div>
  <div class="m-2 flex flex-row justify-center rounded-xl bg-base-300 p-3">
    <span class="font-bold">{minecraftStatus?.players.online ?? "-"}</span
    >&nbsp;spelare online just nu
  </div>
</div>
