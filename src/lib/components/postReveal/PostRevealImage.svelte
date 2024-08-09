<script lang="ts">
  export let src: string;
  export let alt: string;
</script>

<figure class="h-80 w-full overflow-hidden rounded-box border-none bg-neutral">
  <img {src} {alt} class="h-full w-full object-cover" />
</figure>
