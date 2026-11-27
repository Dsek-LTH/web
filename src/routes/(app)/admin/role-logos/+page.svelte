<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";

  let { data } = $props();
</script>

<SetPageTitle title={m.admin_roleLogos_pageTitle()} />

<div class="mx-auto w-full max-w-5xl px-4 py-8">
  <h1 class="mb-2 text-3xl font-bold">{m.admin_roleLogos_pageTitle()}</h1>
  <p class="text-muted-foreground mb-6">
    {m.admin_roleLogos_pageDesc()}
  </p>

  <div class="flex flex-col divide-y">
    {#each data.nodes as node (node.path)}
      <div
        class="flex flex-wrap items-center gap-3 py-2"
        style="padding-left: {node.depth * 1.25}rem"
      >
        <div class="flex size-8 shrink-0 items-center justify-center">
          {#if node.effectiveLogoUrl}
            <img
              src={node.effectiveLogoUrl}
              alt=""
              class="max-h-8 max-w-8 object-contain"
            />
          {:else}
            <span class="text-muted-foreground">—</span>
          {/if}
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate font-mono text-sm">{node.path}</p>
          {#if node.inheritedFrom}
            <p class="text-muted-foreground text-xs">
              {m.admin_roleLogos_inherited({ path: node.inheritedFrom })}
            </p>
          {/if}
        </div>

        <form method="POST" action="?/save" use:enhance class="flex gap-2">
          <input type="hidden" name="path" value={node.path} />
          <Input
            name="logoUrl"
            value={node.ownLogoUrl}
            placeholder={m.admin_roleLogos_logoUrl()}
            aria-label="{m.admin_roleLogos_logoUrl()} {node.path}"
            class="w-64"
          />
          <Button type="submit" size="sm" variant="outline">
            {m.save()}
          </Button>
        </form>
      </div>
    {/each}
  </div>
</div>
