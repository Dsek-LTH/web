<script lang="ts">
  import { twMerge } from "tailwind-merge";

  interface Props {
    name: string;
    value: number | null;
    constraints?: object | undefined;
    class?: string | undefined;
  }

  let {
    name,
    value = $bindable(),
    constraints = undefined,
    class: clazz = undefined,
  }: Props = $props();
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
