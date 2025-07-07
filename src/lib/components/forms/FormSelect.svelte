<script lang="ts" module>
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
  // https://johnnyreilly.com/typescript-5-importsnotusedasvalues-error-eslint-consistent-type-imports#no-import-type-side-effects
  import type { HTMLSelectAttributes } from "svelte/elements";

  let {
    superform,
    field,
    label = null,
    // as long as field is not nested, or data type is 'json', name does not need to be set
    name = undefined,
    options,
    class: clazz = undefined,
    ...restProps
  }: {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
    label?: string | null;
    name?: string;
    options: Array<{
      label?: string;
      value: O;
    }>;
    class?: string;
  } & HTMLSelectAttributes = $props();

  let fieldProxy = $derived(
    formFieldProxy(superform, field) satisfies FormFieldProxy<O[]>,
  );
  let value = $derived(fieldProxy.value);
  let errors = $derived(fieldProxy.errors);
  let constraints = $derived(fieldProxy.constraints);
</script>

<Labeled
  {label}
  error={$errors}
  required={$constraints?.required}
  {...restProps}
>
  <select
    class={twMerge(
      "select select-bordered transition-all hover:enabled:border-base-content",
      clazz,
    )}
    name={name ?? field}
    bind:value={$value}
    {...$constraints}
    {...restProps}
  >
    {#each options as option}
      <option value={option.value}>{option.label ?? option.value}</option>
    {/each}
  </select>
</Labeled>
