<script lang="ts">
  import { getPdfApiUrl } from "$lib/utils/servePdf";

  export let name: string;
  export let url: string;
  export let host = false;
  export let full = false;

  let pdf: HTMLIFrameElement;

  let dialog: HTMLDialogElement;
  let src = (host ? getPdfApiUrl(url) : url) ?? "";
  let open = false;
  if (!src?.includes("#pagemode=none")) {
    src = `${url}#pagemode=none`;
  }

  $: fileName = name.includes(".")
    ? name.substring(0, name.lastIndexOf(".")).replace(/_+/g, " ")
    : name;
</script>

<div class="flex items-center gap-2" class:w-full={full} data-tip={fileName}>
  <button
    class="link
  py-2 no-underline hover:underline
  "
    on:click|preventDefault={() => {
      open = true;
      dialog.showModal();
    }}
  >
    <span
      class="i-mdi-file-document-outline align-text-top text-xl text-primary"
    ></span>{name}
  </button>
  <dialog class="modal modal-middle" bind:this={dialog}>
    <form method="dialog" class="modal-backdrop">
      <button class="cursor-auto"></button>
    </form>
    {#if open}
      <iframe
        bind:this={pdf}
        title=""
        src={getPdfApiUrl(src)}
        class="menu modal-box h-full max-h-[95vh] w-full max-w-[70vw]"
        on:error={() => {
          open = false;
          dialog.close();
          pdf.src = "";
        }}
      />
    {/if}
  </dialog>
  <!-- download link -->
  <a
    href={getPdfApiUrl(url)}
    download={name}
    class="link no-underline hover:link-primary hover:underline"
    ><span class="i-mdi-download align-text-top text-xl"></span></a
  >
</div>
