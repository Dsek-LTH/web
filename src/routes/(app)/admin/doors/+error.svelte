<script lang="ts">
  import { page } from "$app/state";
  import { Card, CardContent } from "$lib/components/ui/card";
  import Error from "@lucide/svelte/icons/octagon-x";
</script>

<Card>
  <CardContent>
    <div class="flex flex-col items-center gap-8 py-8">
      <Error size={96} class="text-muted-foreground" />
      <h1 class="text-muted-foreground">
        {page.status}: {page.error?.message}
      </h1>
    </div>
  </CardContent>
</Card>
