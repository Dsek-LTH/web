<script lang="ts" module>
  type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import LoadingButton from "$lib/components/LoadingButton.svelte";

  import { type SuperForm } from "sveltekit-superforms";

  interface Props {
    superform: SuperForm<T>;
    class?: string | undefined;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let {
    superform,
    class: clazz = undefined,
    children,
    ...rest
  }: Props = $props();

  const { delayed } = superform;
</script>

<LoadingButton class={clazz} type="submit" isLoading={$delayed} {...rest}>
  {@render children?.()}
</LoadingButton>
