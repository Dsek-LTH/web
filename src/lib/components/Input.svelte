<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import { twMerge } from "tailwind-merge";

  export let name: string;
  export let label: string | null = null;
  export let placeholder: string | null = label;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is needed for generic use
  export let value: any | null = null;
  export let required: boolean | null = null;
  export let error: string | string[] | undefined = undefined;
  export let explanation: string | null = null;
  export let textarea = false;
  let clazz = "";
  export { clazz as class };
</script>

<Labeled {label} {error} {explanation} {required}>
  {#if textarea}
    <textarea
      id={name}
      {name}
      class={twMerge(
        "textarea textarea-bordered hover:border-base-content",
        clazz,
      )}
      bind:value
      {placeholder}
      {required}
      {...$$restProps}
    />
  {:else}
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
  {/if}
</Labeled>
