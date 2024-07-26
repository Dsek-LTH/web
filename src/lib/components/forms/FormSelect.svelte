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

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T>;
  export let label: string | null = null;
  export let options: Array<{
    label?: string;
    value: O;
  }>;

  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<O[]>;
</script>

<Labeled {label} error={$errors}>
  <select name={field} bind:value={$value} {...$constraints}>
    {#each options as option}
      <option value={option.value}>{option.label ?? option.value}</option>
    {/each}
  </select>
</Labeled>
