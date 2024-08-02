<script lang="ts">
  import { page } from "$app/stores";
  import { colors } from "$lib/utils/themes";

  export let data: string;
  $: theme = $page.data.theme;

  $: qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&format=svg&color=fff&bgcolor=${colors[
    theme
  ].primary.substring(1)}&data=${encodeURIComponent(data)}`;
</script>

<div class="aspect-square max-w-80 self-center rounded-xl bg-primary p-8">
  <img alt="QR code for ticket" src={qrCodeUrl} />
</div>
