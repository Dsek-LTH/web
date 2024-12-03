<script lang="ts" context="module">
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Labeled from "$lib/components/Labeled.svelte";

  import {
    filesProxy,
    type FormPathArrays,
    type SuperForm,
  } from "sveltekit-superforms";
  import { twMerge } from "tailwind-merge";

  export let superform: SuperForm<T>;
  export let field: FormPathArrays<T>;
  export let label: string | null = null;
  // as long as field is not nested, or data type is 'json', name does not need to be set
  export let name: string | undefined = undefined;
  export let accept: string | undefined = undefined;
  let clazz: string | undefined = undefined;
  export { clazz as class };

  export let onChange:
    | ((
        event: Event & {
          currentTarget: EventTarget & HTMLInputElement;
        },
      ) => void)
    | undefined = undefined;

  $: files = filesProxy(superform, field);
</script>

<Labeled
  {label}
  {...$$restProps}
>
  <input
    on:change={onChange}
    {name}
    multiple
    type="file"
    bind:files={$files}
    class={twMerge("file-input file-input-bordered w-full", clazz)}
    {accept}
  />
</Labeled>