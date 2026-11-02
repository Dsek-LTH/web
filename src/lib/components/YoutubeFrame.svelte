<script lang="ts">
  let {
    src,
    title,
    lazy = false,
  }: {
    src: string;
    /** Describes the video for screen readers. */
    title: string;
    lazy?: boolean;
  } = $props();
</script>

<iframe
  class="size-full border-0"
  {src}
  {title}
  loading={lazy ? "lazy" : undefined}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen
></iframe>
