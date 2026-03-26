<script>
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import * as m from "$paraglide/messages";
</script>

<!-- TODO: Add functionality -->
<ToggleGroup.Root
  type="single"
  variant="default"
  spacing={3}
  size="lg"
  value="a"
>
  <ToggleGroup.Item
    class="ring-primary/30 text-muted-foreground data-[state=on]:text-foreground p-4 data-[state=on]:ring"
    value="a">{m.booking_allBookings()}</ToggleGroup.Item
  >
  <ToggleGroup.Item
    class="ring-primary/30 text-muted-foreground data-[state=on]:text-foreground p-4 data-[state=on]:ring"
    value="b">{m.booking_myBookings()}</ToggleGroup.Item
  >
</ToggleGroup.Root>
