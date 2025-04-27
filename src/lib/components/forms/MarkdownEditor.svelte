<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import { twMerge } from "tailwind-merge";

  interface Props {
    name: string;
    label?: string | null;
    placeholder?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is needed for generic use
    value?: any | null;
    required?: boolean;
    error?: string | string[] | undefined;
    explanation?: string | null;
    class?: string;
    [key: string]: any;
  }

  let {
    name,
    label = null,
    placeholder = label,
    value = $bindable(null),
    required = false,
    error = undefined,
    explanation = null,
    class: clazz = "",
    ...rest
  }: Props = $props();
</script>

<Labeled {label} {error} {explanation} {required}>
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
    {...rest}
  ></textarea>
</Labeled>
