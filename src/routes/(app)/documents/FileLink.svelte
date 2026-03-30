<script lang="ts">
  import { cn } from "$lib/utils";
  import { getPdfApiUrl } from "$lib/utils/servePdf";
  import FileText from "@lucide/svelte/icons/file-text";

  let {
    name,
    url,
    host = false,
    full = false,
    class: klass,
  }: {
    name: string;
    url: string;
    host?: boolean;
    full?: boolean;
    class?: string;
  } = $props();

  let fileName = $derived(
    name.includes(".")
      ? name.substring(0, name.lastIndexOf(".")).replace(/_+/g, " ")
      : name,
  );
</script>

<a
  href={host ? getPdfApiUrl(url) : url}
  class={cn(
    klass,
    "flex flex-row items-center gap-1 rounded-sm px-4 py-2 transition-all hover:underline",
  )}
  class:w-full={full}
  target="_blank"
  data-tip={fileName}
  ><FileText class="w-[18px]" />
  {fileName}
</a>
