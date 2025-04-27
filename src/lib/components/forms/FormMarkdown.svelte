<script lang="ts" module>
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import MarkdownEditor from "$lib/components/forms/MarkdownEditor.svelte";
  import {
    formFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";

  interface Props {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
    // as long as field is not nested, or data type is 'json', name does not need to be set
    name?: string | undefined;
    label?: string | null;
    [key: string]: any;
  }

  let {
    superform,
    field,
    name = undefined,
    label = null,
    ...rest
  }: Props = $props();

  let fieldProxy = $derived(formFieldProxy(superform, field));
  let value = $derived(fieldProxy.value);
  let errors = $derived(fieldProxy.errors);
  let constraints = $derived(fieldProxy.constraints);
</script>

<MarkdownEditor
  name={name ?? field}
  {label}
  bind:value={$value}
  error={$errors}
  {...$constraints}
  {...rest}
/>
