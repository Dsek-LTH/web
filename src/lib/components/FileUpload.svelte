<script lang="ts">
  import { Input } from "./ui/input";
  import Link from "@lucide/svelte/icons/link";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index";
  import * as m from "$paraglide/messages";
  import { twMerge } from "tailwind-merge";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils";

  let {
    files = $bindable(),
    url = $bindable(),
    class: klass,
    ...restProps
  }: {
    files?: FileList;
    url?: string;
    class?: string;
  } & WithoutChildren<WithElementRef<HTMLInputAttributes>> = $props();

  let uploads: string[] = $state([]);

  let urlInput: HTMLInputElement | null = $state(null);
  let urlError: string | undefined = $state();

  $effect(() => {
    Array.from(files ?? []).forEach((upload) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const datatype = result.substring(0, 30);
          if (
            datatype.includes("png") ||
            datatype.includes("jpg") ||
            datatype.includes("octet-stream") ||
            datatype.includes("webp")
          ) {
            uploads = [...uploads, result];
          } else {
            uploads = [...uploads, upload.name];
          }
        }
      };
      reader.readAsDataURL(upload);
    });
  });
</script>

<div
  ondrop={(e) => {
    e.preventDefault();
    files = e.dataTransfer?.files;
  }}
  ondragover={(e) => {
    e.preventDefault();
  }}
  role="form"
  id="fileupload-form"
  class={twMerge(
    klass,
    "bg-secondary-background border-border flex h-[256px] flex-col items-center justify-center rounded-md border-[1px] text-center",
  )}
>
  <div class="mb-4 flex flex-col">
    <h6>{m.fileupload_title()}</h6>
    <p class="text-muted-foreground mt-0">
      {m.fileupload_filetypes()}
    </p>
  </div>
  <div class="flex flex-col gap-4 px-16">
    <Input {...restProps} bind:files class="w-26" type="file" />
    <Separator text={m.fileupload_or()} textClass="font-medium" />

    <AlertDialog.Root>
      <AlertDialog.Trigger
        class={cn(
          "bg-secondary-background text-secondary-foreground hover:bg-secondary-hover dark:bg-input/30 dark:border-input dark:hover:bg-input/50 w-26 border shadow-xs",
          "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          "h-9 px-4 py-2 has-[>svg]:px-3",
        )}
      >
        <Link />{m.fileupload_choose_url()}
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>{m.fileupload_dialog_title()}</AlertDialog.Title>
          <AlertDialog.Description>
            <Input
              bind:ref={urlInput}
              aria-errormessage={urlError}
              type="text"
              placeholder="https://example.com/image.png"
            />
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>{m.dialog_cancel()}</AlertDialog.Cancel>
          <AlertDialog.Action
            onclick={async () => {
              let res = await fetch(urlInput!.value).catch(() => {
                urlError = m.fileupload_error();
              });
              if (res != null) {
                urlError = "";
                let blob = await res.blob();
                let file = new File(
                  [blob],
                  res.headers.get("content-disposition") ??
                    "upload_" + Date.now(),
                );
                const dt = new DataTransfer();
                dt.items.add(file);
                files = dt.files;
              }
            }}>{m.dialog_submit()}</AlertDialog.Action
          >
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </div>
</div>
{#if uploads.length > 0}
  <div
    class="bg-muted-background border-border mt-2 flex w-full flex-row flex-wrap rounded-md border-[1px] p-2"
  >
    {#each uploads as file (file)}
      <img class="m-1 max-h-24" src={file} alt={file} />
    {/each}
  </div>
{/if}
