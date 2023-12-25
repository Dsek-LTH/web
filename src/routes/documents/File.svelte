<script lang="ts">
  import { displayPdf } from "$lib/utils/servePdf";

  export let name: string;
  export let url: string | undefined;
  export let host: boolean = false;
  export let full: boolean = false;
  $: fileName = name.includes(".")
    ? name.substring(0, name.lastIndexOf(".")).replace(/_+/g, " ")
    : name;
</script>

<div class={`flex ${full && "w-full"}`} data-tip={fileName}>
  <a
    href={host ? displayPdf(url) : url}
    class={`block overflow-hidden text-ellipsis whitespace-nowrap py-2 text-left ${
      full && "w-full"
    } hover:underline`}
    ><span
      class="i-mdi-file-document-outline align-text-top text-xl text-primary"
    ></span>
    {fileName}
  </a>
</div>
