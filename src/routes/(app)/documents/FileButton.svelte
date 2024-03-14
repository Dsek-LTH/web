<script lang="ts">
  import { goto } from "$app/navigation";

  export let name: string;
  export let url: string;
  export let onClick: (url: string) => void;
</script>

<div class="flex items-center gap-2 py-2">
  <button
    class="link flex items-center gap-2 text-left no-underline hover:underline"
    on:click={(e) => {
      // don't open modal if opening a new tab, or we're on too small a screen
      if (e.metaKey || window.innerWidth < 640) {
        goto(url);
      } else {
        onClick(url);
      }
    }}
  >
    <span
      class="i-mdi-file-document-outline align-text-top text-xl text-primary"
    />
    {name}
  </button>

  <a
    href={url}
    download={name}
    class="link no-underline hover:link-primary hover:underline"
  >
    <span class="i-mdi-download align-text-top text-xl" />
  </a>
</div>
