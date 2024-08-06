<script lang="ts" context="module">
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Labeled from "$lib/components/Labeled.svelte";

  import {
    fileProxy,
    formFieldProxy,
    type FormFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";
  import { twMerge } from "tailwind-merge";

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T>;
  export let label: string | null = null;
  // as long as field is not nested, or data type is 'json', name does not need to be set
  export let name: string | undefined = undefined;
  let clazz: string | undefined = undefined;
  export { clazz as class };

  export let onChange:
    | ((
        event: Event & {
          currentTarget: EventTarget & HTMLInputElement;
        },
      ) => void)
    | undefined = undefined;

  $: fieldProxy = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<File>;
  $: file = fileProxy(superform, field);
  $: errors = fieldProxy.errors;
  $: constraints = fieldProxy.constraints;
</script>

<Labeled
  {label}
  error={$errors}
  required={$constraints?.required}
  {...$$restProps}
>
  <input
    on:change={onChange}
    {name}
    type="file"
    accept="image/*"
    bind:files={$file}
    class={twMerge("file-input file-input-bordered w-full max-w-xs", clazz)}
    {...$constraints}
    {...$$restProps}
  />
</Labeled>
