<script lang="ts" module>
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import { twMerge } from "tailwind-merge";
  import Labeled from "$lib/components/Labeled.svelte";
  import {
    dateProxy,
    formFieldProxy,
    type FormFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
    // as long as field is not nested, or data type is 'json', name does not need to be set
    name?: string | undefined;
    label?: string | null;
    id?: string | null;
    onlyDate?: boolean;
    class?: string | undefined;
  }

  let {
    superform,
    field,
    name = undefined,
    label = null,
    id = null,
    onlyDate = false,
    class: clazz = undefined,
    ...rest
  }: Props = $props();

  let fieldProxy = $derived(
    formFieldProxy(superform, field) satisfies FormFieldProxy<Date>,
  );
  let errors = $derived(fieldProxy.errors);
  let constraints = $derived(fieldProxy.constraints);
  let date = $derived(
    dateProxy(superform, field, {
      format: onlyDate ? "date" : "datetime-local",
    }),
  );
</script>

<Labeled {label} error={$errors}>
  {#if onlyDate}
    <input
      {id}
      {name}
      type="date"
      bind:value={$date}
      aria-invalid={$errors ? "true" : undefined}
      {...$constraints}
      min={$constraints?.min?.toString().slice(0, 10)}
      max={$constraints?.max?.toString().slice(0, 10)}
      {...rest}
      class={twMerge("input input-bordered", clazz ?? "")}
    />
  {:else}
    <input
      {id}
      {name}
      type="datetime-local"
      bind:value={$date}
      aria-invalid={$errors ? "true" : undefined}
      {...$constraints}
      min={$constraints?.min?.toString().slice(0, 10)}
      max={$constraints?.max?.toString().slice(0, 10)}
      {...rest}
      class={twMerge("input input-bordered", clazz ?? "")}
    />
  {/if}
</Labeled>
