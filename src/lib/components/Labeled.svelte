<script lang="ts">
  export let id: string;
  export let label: string | null = null;
  export let explanation: string | null = null;
</script>

<div class="inline-flex flex-col items-stretch">
  {#if label}
    <label class="label" for={id}>
      <span class="label-text">
        {label}
        {#if explanation}
          <span class="badge badge-neutral tooltip px-1" data-tip={explanation}>?</span>
        {/if}
      </span>
    </label>
  {/if}
  <slot {label} />
</div>
