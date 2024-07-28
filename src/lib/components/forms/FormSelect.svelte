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
  export let options: Array<{
    label?: string;
    value: O;
  }>;
  let clazz: string | undefined = undefined;
  export { clazz as class };

  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<O[]>;
</script>

<Labeled {label} error={$errors}>
  <select
    class={twMerge(
      "select select-bordered transition-all hover:border-base-content",
      clazz,
    )}
    name={field}
    bind:value={$value}
    {...$constraints}
  >
    {#each options as option}
      <option value={option.value}>{option.label ?? option.value}</option>
    {/each}
  </select>
</Labeled>
