<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import DoorClosed from "@lucide/svelte/icons/door-closed";
</script>

<Card>
  <CardContent>
    <div class="flex flex-col items-center gap-8 py-8">
      <DoorClosed size={96} class="text-muted-foreground" />
      <p class="text-muted-foreground">
        Välj en dörr för att hantera åtkomstregler
      </p>
    </div>
  </CardContent>
</Card>
