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
  // as long as field is not nested, or data type is 'json', name does not need to be set
  export let name: string | undefined = undefined;
  export let label: string | null = null;

  $: fieldProxy = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<number>;
  $: value = numberProxy(superform, field);
  $: errors = fieldProxy.errors;
  $: constraints = fieldProxy.constraints;
</script>

<Input
  name={name ?? field}
  type="number"
  {label}
  bind:value={$value}
  error={$errors}
  {...$constraints}
  {...$$restProps}
/>
