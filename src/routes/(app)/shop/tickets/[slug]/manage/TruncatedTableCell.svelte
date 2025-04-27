<script lang="ts">
  import { twMerge } from "tailwind-merge";

  // null represents N/A (not applicable), like purchased at on a non-purchased consumable

  interface Props {
    // undefined represents not set, will be represented as "-"
    value: string | number | Date | undefined | null;
    // will make the cell link somewhere
    link?: string | undefined;
    class?: string | undefined;
    [key: string]: any;
  }

  let {
    value,
    link = undefined,
    class: clazz = undefined,
    ...rest
  }: Props = $props();

  let valueToShow = $derived(
    value === undefined ? "-" : value === null ? "N/A" : value,
  );
</script>

<td>
  <div class="tooltip" data-tip={value ? value : ""}>
    <span
      class={twMerge(
        "tooltip max-w-32 overflow-x-hidden text-ellipsis whitespace-nowrap",
        clazz,
      )}
      {...rest}
    >
      {#if link}
        <a class="link text-primary" href={link}>{valueToShow}</a>
      {:else}
        {valueToShow}
      {/if}
    </span>
  </div>
</td>
