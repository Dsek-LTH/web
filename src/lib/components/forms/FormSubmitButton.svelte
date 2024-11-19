<script lang="ts" context="module">
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import LoadingButton from "$lib/components/LoadingButton.svelte";

  import { type SuperForm } from "sveltekit-superforms";

  export let superform: SuperForm<T>;
  let clazz: string | undefined = undefined;
  export { clazz as class };
  export let form: string | undefined = undefined;
  const { delayed } = superform;
</script>

<LoadingButton
  class={clazz}
  type="submit"
  {form}
  isLoading={$delayed}
  {...$$restProps}
>
  <slot />
</LoadingButton>
