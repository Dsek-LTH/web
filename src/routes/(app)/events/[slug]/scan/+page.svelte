<script lang="ts">
  import QRCodeScanner from "$lib/components/QRCodeScanner.svelte";
  import { goto } from "$lib/utils/redirect";
  import { page } from "$app/stores";

  function handleScan(qrCodeUuid: string) {
    // Navigate to the event scan page with the scanned QR code UUID
    goto(`${$page.url.pathname}/${qrCodeUuid}`);
  }
</script>

<QRCodeScanner onScan={handleScan} />
