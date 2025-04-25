<script lang="ts">
  import { twMerge } from "tailwind-merge";

  interface Props {
    class?: string;
    price: number;
    prefix?: import("svelte").Snippet;
    suffix?: import("svelte").Snippet;
  }

  let { class: clazz = "", price, prefix, suffix }: Props = $props();
  const formatter = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
</script>

<span class={twMerge("font-semibold text-success", clazz)}>
  {@render prefix?.()}
  {formatter.format(price / 100)}
  {@render suffix?.()}
</span>
