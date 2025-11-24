<script lang="ts">
  import Button from "./ui/button/button.svelte";
  import { Input } from "./ui/input";
  import Link from "@lucide/svelte/icons/link";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index";
  import * as m from "$paraglide/messages";
  import { twMerge } from "tailwind-merge";

  let {
    files = $bindable(),
    url = $bindable(),
    class: klass,
  }: { files?: FileList; url?: string; class?: string } = $props();

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
    <Input bind:files class="w-26" type="file" />
    <Separator text={m.fileupload_or()} textClass="font-medium" />

    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button class="w-26" variant="outline"
          ><Link />{m.fileupload_choose_url()}</Button
        >
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
