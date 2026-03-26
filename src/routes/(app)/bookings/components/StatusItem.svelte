<script lang="ts">
  import * as Item from "$lib/components/ui/item";
  import { tv, type VariantProps } from "tailwind-variants";

  const variants = tv({
    base: "uppercase",
    variants: {
      variant: {
        accepted: "text-primary",
        pending: "text-lila-400",
        rejected: "text-destructive",
      },
      mode: {
        mobile: "mx-auto mt-0.5 text-[0.7rem] leading-none tracking-wide",
        desktop: "text-xs leading-none",
      },
    },
  });

  type Variant = VariantProps<typeof variants>["variant"];
  type Mode = VariantProps<typeof variants>["mode"];

  const {
    mode,
    variant,
    count,
  }: {
    mode: Exclude<Mode, undefined>;
    variant: Exclude<Variant, undefined>;
    count: number;
  } = $props();

  const descriptionColour = $derived(
    variant === "rejected" ? "text-destructive" : "text-foreground",
  );
</script>

{#if mode === "desktop"}
  <Item.Root class="w-36 px-6 py-4" variant="muted">
    <Item.Content>
      <Item.Title class={variants({ variant, mode })}>{variant}</Item.Title>
      <Item.Description class={`mt-0 text-4xl font-bold ${descriptionColour}`}>
        {count}
      </Item.Description>
    </Item.Content>
  </Item.Root>
{:else}
  <Item.Root class="py-4" variant="muted">
    <Item.Content>
      <Item.Description
        class={`mx-auto text-3xl font-bold ${descriptionColour}`}
        >{count}</Item.Description
      >
      <Item.Title class={variants({ variant, mode })}>{variant}</Item.Title>
    </Item.Content>
  </Item.Root>
{/if}
