<script lang="ts">
  import type {
    HTMLButtonAttributes,
    MouseEventHandler,
  } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  interface Props extends HTMLButtonAttributes {
    /**
     * ms to wait before showing the loading spinner
     * The reason behind this can be read up on here: https://www.nngroup.com/articles/response-times-3-important-limits/
     *
     * TL;DR
     * Under 100ms delay, the user feels it as instant.
     * Over 1000ms delay, the user feels it as a separate task.
     * 500ms is a sweet spot to show a loading spinner to tell the user something is happening.
     */
    delay?: number;
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
    isLoading?: boolean;
    disabled?: boolean;
    class?: string | undefined;
    children?: import("svelte").Snippet;
  }

  let {
    onClick = undefined,
    isLoading = $bindable(false),
    disabled = false,
    delay = 500,
    class: clazz = undefined,
    children,
    ...rest
  }: Props = $props();
</script>

<button
  {...rest}
  class={twMerge("relative", clazz)}
  disabled={disabled || isLoading}
  onclick={onClick
    ? async (e) => {
        const timeout = setTimeout(() => {
          isLoading = true;
        }, delay);
        await onClick?.(e); // svelte doesn't recoginize that this is non-nullable
        clearTimeout(timeout);
        isLoading = false;
      }
    : undefined}
>
  {@render children?.()}
  <div
    class="absolute inset-0 flex items-center justify-center transition-all"
    class:opacity-0={!isLoading}
  >
    <span class="loading"></span>
  </div>
</button>
