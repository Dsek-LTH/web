<script lang="ts" context="module">
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import Labeled from "$lib/components/Labeled.svelte";

  import {
    fileProxy,
    filesProxy,
    type FormPathArrays,
    type FormPathLeaves,
    type SuperForm,
    formFieldProxy,
  } from "sveltekit-superforms";
  import { twMerge } from "tailwind-merge";
  import imageCompression from "browser-image-compression";
  import type { Options as CompressionOptions } from "browser-image-compression";

  export let superform: SuperForm<T>;
  export let field: FormPathLeaves<T> | FormPathArrays<T, File[]>;
  export let label: string | null = null;
  // as long as field is not nested, or data type is 'json', name does not need to be set
  export let name: string | undefined = undefined;
  export let accept: string | undefined = undefined;
  export let multiple = false;
  let clazz: string | undefined = undefined;
  export { clazz as class };

  export let onChange:
    | ((
        event: Event & {
          currentTarget: EventTarget & HTMLInputElement;
        },
      ) => void)
    | undefined = undefined;

  $: fieldProxy = formFieldProxy(superform, field as FormPathLeaves<T>);
  $: singleFileStore = fileProxy(superform, field as FormPathLeaves<T>);
  $: multipleFilesStore = filesProxy(
    superform,
    field as unknown as FormPathArrays<T, File[]>,
  );

  $: fileStore = multiple ? multipleFilesStore : singleFileStore;
  $: constraints = fieldProxy.constraints;

  // Errors might look like this:
  // {0: ["File is too large"], 1: ["File is too large"]}.  <- An object
  // So this converts it to [["File is too large"], ["File is too large"]] <- An array
  $: internalErrors = fieldProxy.errors;
  function processErrors(errors: typeof $internalErrors) {
    if (!errors) return undefined;

    if (typeof errors === "string") return errors as string;
    if (Array.isArray(errors)) return errors as string[];
    return Object.values(errors) as string[][] | string[];
  }
  $: errors = processErrors($internalErrors) as
    | string
    | string[]
    | string[][]
    | undefined;

  export let compressionOptions: CompressionOptions | undefined = undefined;

  // Default compression options (can be extended via props if needed)
  const finalCompressionOptions: CompressionOptions = {
    maxSizeMB: 8,
    useWebWorker: true,
    initialQuality: 0.8,
    ...(compressionOptions ?? {}),
  };

  async function handleFileChange(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const filesList = event.currentTarget.files;
    if (!filesList || filesList.length === 0) {
      if (multiple) {
        multipleFilesStore.set([]);
      } else {
        singleFileStore.set(null as unknown as File);
      }
      return;
    }
    if (multiple) {
      const fileArr = Array.from(filesList);
      const processedFiles = await Promise.all(
        fileArr.map(async (f) => {
          if (f.type.startsWith("image/")) {
            try {
              const compressedBlob = await imageCompression(
                f,
                finalCompressionOptions,
              );
              return new File([compressedBlob], f.name, {
                type: f.type,
              });
            } catch (err) {
              console.error("Image compression failed", err);
              return f;
            }
          }
          return f;
        }),
      );
      multipleFilesStore.set(processedFiles);
    } else {
      const fileObj = filesList[0];
      if (!fileObj) {
        singleFileStore.set(null as unknown as File);
        return;
      }
      if (fileObj.type.startsWith("image/")) {
        try {
          const compressedBlob = await imageCompression(
            fileObj,
            finalCompressionOptions,
          );
          singleFileStore.set(
            new File([compressedBlob], fileObj.name, {
              type: fileObj.type,
            }),
          );
        } catch (err) {
          console.error("Image compression failed", err);
          singleFileStore.set(fileObj);
        }
      } else {
        singleFileStore.set(fileObj);
      }
    }
    if (onChange) onChange(event);
  }
</script>

<Labeled
  {label}
  error={errors}
  required={$constraints?.required}
  {...$$restProps}
>
  <input
    on:change={handleFileChange}
    {name}
    type="file"
    {multiple}
    bind:files={$fileStore}
    class={twMerge("file-input file-input-bordered w-full", clazz)}
    {accept}
    {...$constraints}
    {...$$restProps}
  />
</Labeled>
