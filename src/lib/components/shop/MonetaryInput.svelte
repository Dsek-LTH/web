<script lang="ts">
  export let name: string;
  export let value: number;
  export let constraints: object | undefined = undefined;
</script>

<input
  {name}
  bind:value
  class="input input-bordered w-20 min-w-0 max-w-40 shrink grow"
  {...constraints ?? {}}
  step="0.01"
  type="number"
/>
