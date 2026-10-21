<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let {
    src,
    title,
    lazy = false,
    class: klass,
  }: {
    src: string;
    /** Describes the video for screen readers. */
    title: string;
    lazy?: boolean;
    class?: string;
  } = $props();
</script>

<iframe
  class={twMerge("size-full border-0", klass)}
  {src}
  {title}
  loading={lazy ? "lazy" : undefined}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen
></iframe>
