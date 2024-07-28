<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
  export let price: number;
  const formatter = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
</script>

<span class={twMerge("font-semibold text-success", clazz)}>
  <slot name="prefix" />
  {formatter.format(price / 100)}
  <slot name="suffix" />
</span>
