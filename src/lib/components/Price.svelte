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

<span class={twMerge("font-semibold", clazz)}>
  {formatter.format(price / 100)}
</span>
