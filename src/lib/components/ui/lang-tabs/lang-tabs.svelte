<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  let { sv, en } = $props();
</script>

<Tabs.Root value="sv">
  <Tabs.List>
    <Tabs.Trigger value="sv">SV</Tabs.Trigger>
    <Tabs.Trigger value="en">EN</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="sv">{@render sv()}</Tabs.Content>
  <Tabs.Content value="en">{@render en()}</Tabs.Content>
</Tabs.Root>
