<script>
  import { Button } from "$lib/components/ui/button";
  import { getFileUrl } from "$lib/files/client";
  import * as m from "$paraglide/messages";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
</script>

<div class="layout-container flex h-[95vh] w-full items-center justify-center">
  <Button
    size="lg"
    class="px-9 py-7 text-lg"
    variant="outline"
    data-sveltekit-reload
    href="/nollning"
    ><img
      class="h-lh"
      src={getFileUrl("minio/files/public/photos/staben26_logo.webp")}
      alt="nollning"
    />{m.nav_nollning()} 2026 <ArrowRight /></Button
  >
</div>
