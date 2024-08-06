<script lang="ts" context="module">
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

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T>;
  // as long as field is not nested, or data type is 'json', name does not need to be set
  export let name: string | undefined = undefined;
  export let label: string | null = null;
  export let id: string | null = null;

  $: fieldProxy = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<Date>;
  $: errors = fieldProxy.errors;
  $: constraints = fieldProxy.constraints;
  $: date = dateProxy(superform, field, {
    format: onlyDate ? "date" : "datetime-local",
  });
  export let onlyDate = false;
</script>

<Labeled {label} error={$errors}>
  {#if onlyDate}
    <input
      {id}
      {name}
      type="date"
      aria-invalid={$errors ? "true" : undefined}
      bind:value={$date}
      {...$constraints}
      min={$constraints?.min?.toString().slice(0, 10)}
      max={$constraints?.max?.toString().slice(0, 10)}
      {...$$props}
      class={twMerge("input input-bordered", $$props["class"] ?? "")}
    />
  {:else}
    <input
      {id}
      {name}
      type="datetime-local"
      aria-invalid={$errors ? "true" : undefined}
      bind:value={$date}
      {...$constraints}
      min={$constraints?.min?.toString().slice(0, 10)}
      max={$constraints?.max?.toString().slice(0, 10)}
      {...$$props}
      class={twMerge("input input-bordered", $$props["class"] ?? "")}
    />
  {/if}
</Labeled>
