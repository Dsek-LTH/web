<script lang="ts">
  import CommitteePage from "../CommitteePage.svelte";

  let { data } = $props();
</script>

<CommitteePage {data} />
