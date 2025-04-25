<script lang="ts">
  import Toast from "../../Toast.svelte";
  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
</script>

{@render children?.()}
<Toast />
