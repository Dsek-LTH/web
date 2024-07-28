<script lang="ts" context="module">
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Input from "$lib/components/Input.svelte";

  import {
    formFieldProxy,
    numberProxy,
    type FormFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T>;
  export let label: string | null = null;

  const { errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<number>;
  const value = numberProxy(superform, field);
</script>

<Input
  name={field}
  type="number"
  {label}
  bind:value={$value}
  error={$errors}
  {...$constraints}
  {...$$restProps}
/>
