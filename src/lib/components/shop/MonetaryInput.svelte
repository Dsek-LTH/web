<script lang="ts">
  export let name: string;
  export let value: number | null;
  export let constraints: object | undefined = undefined;
</script>

<input
  {name}
  bind:value
  class="input input-bordered w-20 min-w-0 max-w-40 shrink grow"
  {...constraints ?? {}}
  min={0}
  step="0.01"
  type="number"
/>
