<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
  export let label: string | null = null;
  export let explanation: string | null = null;
  export let error: string | string[] | undefined = undefined;
  export let fullWidth = false;
  export let invisibleText = false;
  export let required: boolean | null = null;
  let _for: string | undefined = undefined;
  export { _for as for };
</script>

<label
  class={twMerge(
    "form-control relative",
    fullWidth ? "w-full md:w-auto " : "",
    clazz,
  )}
  for={_for}
>
  {#if label}
    <div class="label">
      <span class="label-text" class:invisible={invisibleText}>
        {label}{#if required}
          <span class="font-bold">*</span>
        {/if}
        {#if explanation}
          <span
            class="badge badge-neutral tooltip aspect-square px-1"
            data-tip={explanation}
          >
            ?
          </span>
        {/if}
      </span>
    </div>
  {/if}
  <slot {label} />
  {#if error !== undefined}
    <div class="label">
      <span
        class="form-error label-text-alt text-error"
        class:invisible={invisibleText}
      >
        {#if typeof error === "string"}{error}{:else}{error.join(", ")}{/if}
      </span>
    </div>
  {/if}
</label>
