<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type {
    HTMLInputAttributes,
    HTMLTextareaAttributes,
  } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  let {
    class: clazz = "",
    name,
    label = null,
    placeholder = label,
    value = $bindable(null),
    required = false,
    error = undefined,
    explanation = null,
    textarea = false,
    ...restProps
  }: {
    name: string;
    label: string | null;
    placeholder: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is needed for generic use
    value: any | null;
    required: boolean;
    error: string | string[] | undefined;
    explanation: string | null;
    textarea: boolean;
    class: string;
  } & (HTMLInputAttributes | HTMLTextareaAttributes) = $props();
</script>

<Labeled {label} {error} {explanation} {required}>
  {#if textarea}
    <textarea
      id={name}
      {name}
      class={twMerge(
        "textarea textarea-bordered hover:border-base-content",
        clazz,
      )}
      bind:value
      {placeholder}
      {required}
      {...restProps as HTMLTextareaAttributes}
    ></textarea>
  {:else}
    <input
      id={name}
      {name}
      class={twMerge("input input-bordered hover:border-base-content", clazz)}
      bind:value
      type="text"
      {placeholder}
      {required}
      {...restProps as HTMLInputAttributes}
    />
  {/if}
</Labeled>
