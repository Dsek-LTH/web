<script lang="ts">
  export let id: string;
  export let label: string | null = null;
  export let explanation: string | null = null;
  export let error: string | string[] | undefined = undefined;
  export let fullWidth = false;
</script>

<div
  class={`relative inline-flex flex-col items-stretch ${
    fullWidth ? "w-full md:w-auto" : ""
  }`}
>
  {#if label}
    <label class="label" for={id}>
      <span class="label-text">
        {label}
        {#if explanation}
          <span class="badge badge-neutral tooltip px-1" data-tip={explanation}>
            ?
          </span>
        {/if}
      </span>
    </label>
  {/if}
  <slot {label} />
  {#if error}
    <p class="text-error">
      {#if typeof error === "string"}{error}{:else}{error.join(", ")}{/if}
    </p>
  {/if}
</div>
