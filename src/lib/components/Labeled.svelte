<script lang="ts">
  export let id: string;
  export let label: string | null = null;
</script>

<div class="inline-flex flex-col items-stretch">
  {#if label}
    <label class="label" for={id}>
      <span class="label-text">{label}</span>
    </label>
  {/if}
  <slot {label} />
</div>
