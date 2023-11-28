<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";

  export let name: string;
  export let label: string | null = null;
  export let placeholder: string | null = label;
  export let value: string | null = null;
  export let required: boolean | null = null;
  export let error: string | string[] | undefined = undefined;
</script>

<Labeled {label} id={name} {error}>
  <input
    id={name}
    {name}
    class="input input-bordered"
    bind:value
    type="text"
    {placeholder}
    {required}
  />
</Labeled>
