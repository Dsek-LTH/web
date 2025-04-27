<script lang="ts" module>
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Labeled from "$lib/components/Labeled.svelte";

  import {
    formFieldProxy,
    type FormFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";
  import { twMerge, type ClassNameValue } from "tailwind-merge";

  interface Props {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
    // as long as field is not nested, or data type is 'json', name does not need to be set
    name?: string | undefined;
    label?: string | null;
    class?: ClassNameValue;
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
    formFieldProxy(superform, field) satisfies FormFieldProxy<boolean>,
  );
  let value = $derived(fieldProxy.value);
  let errors = $derived(fieldProxy.errors);
</script>

<Labeled {label} error={$errors} {...rest}>
  <input
    name={name ?? field}
    type="checkbox"
    class={twMerge("checkbox ml-2", clazz)}
    bind:checked={$value}
    {...rest}
  />
</Labeled>
