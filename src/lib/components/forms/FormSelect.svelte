<script lang="ts" context="module">
  type T = Record<string, unknown>;
  type O = unknown;
</script>

<script
  lang="ts"
  generics="T extends Record<string, unknown>, O extends unknown"
>
  import Labeled from "$lib/components/Labeled.svelte";

  import {
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
  export let options: Array<{
    label?: string;
    value: O;
  }>;
  let clazz: string | undefined = undefined;
  export { clazz as class };

  $: fieldProxy = formFieldProxy(superform, field) satisfies FormFieldProxy<
    O[]
  >;
  $: value = fieldProxy.value;
  $: errors = fieldProxy.errors;
  $: constraints = fieldProxy.constraints;
</script>

<Labeled {label} error={$errors}>
  <select
    class={twMerge(
      "select select-bordered transition-all hover:border-base-content",
      clazz,
    )}
    name={name ?? field}
    bind:value={$value}
    {...$constraints}
  >
    {#each options as option}
      <option value={option.value}>{option.label ?? option.value}</option>
    {/each}
  </select>
</Labeled>
