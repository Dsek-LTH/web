<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type {
    HTMLInputAttributes,
    HTMLTextareaAttributes,
  } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  type HTMLInput = {
    textarea?: false | null;
  } & HTMLInputAttributes;
  type HTMLTextarea = { textarea: true } & HTMLTextareaAttributes;

  let {
    class: clazz = "",
    name,
    label = null,
    placeholder = label,
    value = $bindable(null),
    required = false,
    error = undefined,
    explanation = null,
    ...props
  }: {
    name: string;
    label?: string | null;
    placeholder?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is needed for generic use
    value?: any | null;
    required?: boolean;
    error?: string | string[];
    explanation?: string | null;
    class?: string;
  } & (HTMLInput | HTMLTextarea) = $props();
</script>

<Labeled {label} {error} {explanation} {required}>
  {#if props.textarea}
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {@const { textarea, ...restProps } = props}
    <textarea
      id={name}
      {name}
      class={twMerge(
        "textarea textarea-bordered hover:border-base-content",
        clazz,
      )}
      {placeholder}
      {required}
      {...restProps}
    ></textarea>
  {:else}
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {@const { textarea, ...restProps } = props}
    <input
      id={name}
      {name}
      class={twMerge("input input-bordered hover:border-base-content", clazz)}
      type="text"
      {placeholder}
      {required}
      {...restProps}
    />
  {/if}
</Labeled>
