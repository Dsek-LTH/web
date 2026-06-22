<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    price,
    class: klass,
    prefix,
    suffix,
  }: {
    price: number;
    class?: string;
    prefix?: Snippet;
    suffix?: Snippet;
  } = $props();

  const formatter = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
</script>

<span class={cn("font-semibold text-green-600", klass)}>
  {@render prefix?.()}
  {formatter.format(price / 100)}
  {@render suffix?.()}
</span>
