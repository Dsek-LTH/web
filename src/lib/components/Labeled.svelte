<script lang="ts">
  import { twMerge } from "tailwind-merge";

  let clazz = "";
  export { clazz as class };
  export let label: string | null = null;
  export let explanation: string | null = null;
  export let error: string | string[] | undefined = undefined;
  export let fullWidth = false;
  export let required: boolean | null = null;
</script>

<label
  class={twMerge(
    "form-control relative",
    fullWidth ? "w-full md:w-auto " : "",
    clazz,
  )}
>
  {#if label}
    <div class="label">
      <span class="label-text">
        {label}{#if required}
          <span class="font-bold">*</span>
        {/if}
        {#if explanation}
          <span class="badge badge-neutral tooltip px-1" data-tip={explanation}>
            ?
          </span>
        {/if}
      </span>
    </div>
  {/if}
  <slot {label} />
  {#if error}
    <div class="label">
      <span class="label-text-alt text-error">
        {#if typeof error === "string"}{error}{:else}{error.join(", ")}{/if}
      </span>
    </div>
  {/if}
</label>
