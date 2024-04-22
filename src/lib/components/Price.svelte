<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
  export let price: number;
</script>

<span class={twMerge("font-semibold text-success", clazz)}>
  {(price / 100).toLocaleString("sv-SE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} SEK
</span>
