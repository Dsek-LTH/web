<script lang="ts">
  import type {
    HTMLInputAttributes,
    HTMLInputTypeAttribute,
  } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";

  type InputType = Exclude<HTMLInputTypeAttribute, "file">;

  type Props = WithElementRef<
    Omit<HTMLInputAttributes, "type"> &
      (
        | { type: "file"; files?: FileList }
        | { type?: InputType; files?: undefined }
      )
  >;

  let {
    ref = $bindable(null),
    value = $bindable(),
    type,
    files = $bindable(),
    class: className,
    "data-slot": dataSlot = "input",
    ...restProps
  }: Props = $props();
</script>

{#if type === "file"}
  <input
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      "selection:bg-primary dark:bg-input/30 selection:text-primary-foreground border-input ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 pt-1.5 text-right text-sm font-medium shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      " aria-invalid:border-rosa-500 dark:aria-invalid:bg-rosa-950 aria-invalid:bg-rosa-50 aria-invalid:text-rosa-500 dark:aria-invalid:text-rosa-500 aria-invalid:border-[1px]",
      className,
    )}
    type="file"
    bind:files
    bind:value
    {...restProps}
  />
{:else}
  <input
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      "focus-visible:border-muted-foreground focus-visible:ring-muted-foreground/20 focus-visible:ring-[3px]",
      " aria-invalid:border-rosa-500 dark:aria-invalid:bg-rosa-950 aria-invalid:bg-rosa-50 aria-invalid:text-rosa-500 dark:aria-invalid:text-rosa-500 aria-invalid:border-[1px]",
      className,
    )}
    {type}
    bind:value
    {...restProps}
  />
{/if}
{#if restProps["aria-errormessage"]}
  <p class="text-rosa-500 mt-0 text-xs font-semibold">
    <CircleAlert class="mb-[2px] inline h-[1rem] w-[1rem]" />
    {restProps["aria-errormessage"]}
  </p>
{/if}
