<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import { twMerge } from "tailwind-merge";

  export let name: string;
  export let label: string | null = null;
  export let placeholder: string | null = label;
  export let values: string[] | number[];
  export let required: boolean | null = null;
  export let error: string | string[] | undefined = undefined;
  export let explanation: string | null = null;
  let clazz: string = "";
  export { clazz as class };
</script>

<Labeled {label} id={name} {error} {explanation}>
  <select
    id={name}
    {name}
    class={twMerge(" select select-bordered hover:border-base-content ", clazz)}
    {placeholder}
    {required}
    {...$$restProps}
  >
    {#each values as value}
      <option>{value}</option>
    {/each}
  </select>
</Labeled>
