<script lang="ts">
  import { marked } from "marked";
  import { twMerge } from "tailwind-merge";

  let {
    body,
    class: klass,
    preview = false,
  }: { body: string; class?: string; preview?: boolean } = $props();

  const html = $derived(marked(body));

  /**
   * Keep links visible and styled like the published article, but block
   * navigation while the editor preview is mounted.
   */
  function guardLinks(node: HTMLElement, enabled: boolean) {
    const blockNavigation = (event: MouseEvent) => {
      if (!enabled) return;
      if (event.target instanceof Element && event.target.closest("a")) {
        event.preventDefault();
      }
    };

    node.addEventListener("click", blockNavigation, true);
    node.addEventListener("auxclick", blockNavigation, true);
    node.addEventListener("contextmenu", blockNavigation, true);

    return {
      update(nextEnabled: boolean) {
        enabled = nextEnabled;
      },
      destroy() {
        node.removeEventListener("click", blockNavigation, true);
        node.removeEventListener("auxclick", blockNavigation, true);
        node.removeEventListener("contextmenu", blockNavigation, true);
      },
    };
  }
</script>

<section
  use:guardLinks={preview}
  class={twMerge(
    "prose dark:prose-invert prose-invert-a:text-rosa-background prose-a:text-rosa-background prose-a:no-underline [&_a:hover]:underline",
    klass,
  )}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
  {@html html}
</section>
