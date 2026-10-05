<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

  let { children } = $props();
</script>

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
