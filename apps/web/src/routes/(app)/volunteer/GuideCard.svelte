<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import type { Component } from "svelte";
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  let {
    title,
    description,
    icon,
    href,
    external = false,
    cta,
    index,
    class: className,
    children,
  }: {
    title: string;
    /** Plain description. Omit and use `children` for richer content. */
    description?: string;
    icon?: Component<{ class?: string }>;
    /** When set, the whole card becomes one link. */
    href?: string;
    /** Opens in a new tab and swaps the arrow for an external-link glyph. */
    external?: boolean;
    /** Label for the link row at the bottom. Only shown together with `href`. */
    cta?: string;
    /** Position in a list, used to stagger the entrance animation. */
    index?: number;
    class?: string;
    children?: Snippet;
  } = $props();
</script>

{#snippet card()}
  <Card.Root
    class={cn(
      "border-border/80 bg-card animate-in fade-in slide-in-from-bottom-[1rem] fill-mode-backwards flex h-full flex-col gap-4 py-6 duration-300",
      href &&
        "group-hover:border-primary/50 transition-all group-hover:-translate-y-1 group-hover:shadow-lg",
      className,
    )}
    style={index === undefined ? undefined : `animation-delay:${index * 50}ms`}
  >
    <Card.Header class="pb-0">
      <div class="flex items-center gap-3">
        {#if icon}
          {@const Icon = icon}
          <div class="bg-primary/10 text-primary shrink-0 rounded-lg p-2">
            <Icon class="size-5" />
          </div>
        {/if}
        <h3
          class={cn(
            "text-base leading-tight font-semibold",
            href && "group-hover:text-primary transition-colors",
          )}
        >
          {title}
        </h3>
      </div>
    </Card.Header>

    <Card.Content
      class="text-muted-foreground flex flex-1 flex-col gap-3 text-base leading-relaxed"
    >
      {#if description}
        <p>{description}</p>
      {/if}
      {@render children?.()}
    </Card.Content>

    {#if href && cta}
      <Card.Footer class="text-primary pt-0 text-sm font-medium">
        <span class="flex items-center gap-1.5">
          {cta}
          {#if external}
            <ExternalLink class="size-3.5" />
          {:else}
            <ArrowRight
              class="size-3.5 transition-transform group-hover:translate-x-1"
            />
          {/if}
        </span>
      </Card.Footer>
    {/if}
  </Card.Root>
{/snippet}

{#if href}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is resolved by the caller -->
  <a
    {href}
    class="group block h-full"
    target={external ? "_blank" : undefined}
    rel={external ? "noreferrer" : undefined}
  >
    {@render card()}
  </a>
{:else}
  {@render card()}
{/if}
