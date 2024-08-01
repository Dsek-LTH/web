<script lang="ts">
  import { twMerge } from "tailwind-merge";

  export let name: string;
  export let value: number | null;
  export let constraints: object | undefined = undefined;
  let clazz: string | undefined = undefined;
  export { clazz as class };
</script>

<input
  {name}
  bind:value
  class={twMerge(
    "input input-bordered w-20 min-w-0 max-w-40 shrink grow",
    clazz,
  )}
  {...constraints ?? {}}
  min={0}
  step="0.01"
  type="number"
/>
