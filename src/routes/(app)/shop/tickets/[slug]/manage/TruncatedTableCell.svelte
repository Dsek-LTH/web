<script lang="ts">
  import { twMerge } from "tailwind-merge";

  // null represents N/A (not applicable), like purchased at on a non-purchased consumable
  // undefined represents not set, will be represented as "-"
  export let value: string | number | Date | undefined | null;
  // will make the cell link somewhere
  export let link: string | undefined = undefined;
  let clazz: string | undefined = undefined;
  export { clazz as class };
  $: valueToShow = value === undefined ? "-" : value === null ? "N/A" : value;
</script>

<td>
  <div class="tooltip" data-tip={value ? value : ""}>
    <span
      class={twMerge(
        "tooltip max-w-32 overflow-x-hidden text-ellipsis whitespace-nowrap",
        clazz,
      )}
      {...$$restProps}
    >
      {#if link}
        <a class="link text-primary" href={link}>{valueToShow}</a>
      {:else}
        {valueToShow}
      {/if}
    </span>
  </div>
</td>
