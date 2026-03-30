<script lang="ts">
  import * as Item from "$lib/components/ui/item";
  import * as m from "$paraglide/messages";
  import { tv, type VariantProps } from "tailwind-variants";

  const variants = tv({
    base: "uppercase",
    variants: {
      variant: {
        ACCEPTED: "text-primary",
        PENDING: "text-lila-400",
        DENIED: "text-destructive",
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
    variant === "DENIED" ? "text-destructive" : "text-foreground",
  );

  const translatedTitle = $derived.by(() => {
    if (variant === "ACCEPTED") return m.booking_accepted();
    if (variant === "PENDING") return m.booking_pending();
    return m.booking_denied();
  });
</script>

{#if mode === "desktop"}
  <Item.Root class="w-36 px-6 py-4" variant="muted">
    <Item.Content>
      <Item.Title class={variants({ variant, mode })}
        >{translatedTitle}</Item.Title
      >
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
      <Item.Title class={variants({ variant, mode })}
        >{translatedTitle}</Item.Title
      >
    </Item.Content>
  </Item.Root>
{/if}
