<script lang="ts">
  import type { PageData } from "./$types";
  import Readme from "$lib/components/home/Readme.svelte";
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<Readme readme={data.readme} />
