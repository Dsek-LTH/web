<script lang="ts" context="module">
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

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T>;
  export let label: string | null = null;
  let clazz: ClassNameValue = undefined;
  export { clazz as class };

  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<boolean>;
</script>

<Labeled {label} error={$errors}>
  <input
    name="forExternalsOnly"
    type="checkbox"
    class={twMerge("checkbox", clazz)}
    bind:checked={$value}
    {...$constraints}
    {...$$restProps}
  />
</Labeled>
