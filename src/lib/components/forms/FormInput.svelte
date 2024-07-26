<script lang="ts" context="module">
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Input from "$lib/components/Input.svelte";

  import {
    formFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T>;
  export let label: string | null = null;

  const { value, errors, constraints } = formFieldProxy(superform, field);
</script>

<Input
  name={field}
  {label}
  bind:value={$value}
  error={$errors}
  {...$constraints}
  {...$$restProps}
/>
