<script lang="ts" module>
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Labeled from "$lib/components/Labeled.svelte";

  import {
    filesProxy,
    formFieldProxy,
    type FormFieldProxy,
    type SuperForm,
  } from "sveltekit-superforms";
  import { twMerge } from "tailwind-merge";

  interface Props {
    superform: SuperForm<T>;
    //export let field: FormPathLeaves<T>;
    field: any;
    label?: string | null;
    // as long as field is not nested, or data type is 'json', name does not need to be set
    name?: string | undefined;
    accept?: string | undefined;
    class?: string | undefined;
    onChange?:
      | ((
          event: Event & {
            currentTarget: EventTarget & HTMLInputElement;
          },
        ) => void)
      | undefined;
    [key: string]: any;
  }

  let {
    superform,
    field,
    label = null,
    name = undefined,
    accept = undefined,
    class: clazz = undefined,
    onChange = undefined,
    ...rest
  }: Props = $props();

  let fieldProxy = $derived(
    formFieldProxy(superform, field) satisfies FormFieldProxy<File[]>,
  );
  let files = $derived(filesProxy(superform, field));
  let errors = $derived(fieldProxy.errors);
  let constraints = $derived(fieldProxy.constraints);
</script>

<Labeled {label} error={$errors} required={$constraints?.required} {...rest}>
  <input
    onchange={onChange}
    {name}
    type="file"
    multiple
    bind:files={$files}
    class={twMerge("file-input file-input-bordered w-full", clazz)}
    {accept}
    {...$constraints}
    {...rest}
  />
</Labeled>
