<script lang="ts" module>
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

  interface Props {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
    // as long as field is not nested, or data type is 'json', name does not need to be set
    name?: string | undefined;
    label?: string | null;
    class?: string | undefined;
    [key: string]: any;
  }

  let {
    superform,
    field,
    name = undefined,
    label = null,
    class: clazz = undefined,
    ...rest
  }: Props = $props();

  let fieldProxy = $derived(
    formFieldProxy(superform, field) satisfies FormFieldProxy<number>,
  );
  let value = $derived(numberProxy(superform, field));
  let errors = $derived(fieldProxy.errors);
  let constraints = $derived(fieldProxy.constraints);
</script>

<Input
  name={name ?? field}
  type="number"
  {label}
  class={clazz}
  bind:value={$value}
  error={$errors}
  {...$constraints}
  {...rest}
/>
