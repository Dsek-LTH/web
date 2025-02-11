<script lang="ts">
  import type { PageData } from "./$types";
  import Readme from "$lib/components/home/Readme.svelte";
  export let data: PageData;
</script>

<Readme readme={data.readme} />
