<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import { twMerge } from "tailwind-merge";

  export let name: string;
  export let label: string | null = null;
  export let placeholder: string | null = label;
  export let value: string | null = null;
  export let required: boolean | null = null;
  export let error: string | string[] | undefined = undefined;
  export let explanation: string | null = null;
  let clazz = "";
  export { clazz as class };
</script>

<Labeled {label} id={name} {error} {explanation}>
  <input
    id={name}
    {name}
    class={twMerge("input input-bordered hover:border-base-content", clazz)}
    bind:value
    type="text"
    {placeholder}
    {required}
    {...$$restProps}
  />
</Labeled>
