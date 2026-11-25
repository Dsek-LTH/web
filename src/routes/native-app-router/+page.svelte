<script lang="ts">
  import { fade } from "svelte/transition";
  import * as messages from "$paraglide/messages";
</script>

<div class="relative h-dvh w-dvw" style="background-color: #f280a1" out:fade>
  <img
    src="/d-white.webp"
    alt={messages.guild_logo()}
    class="absolute top-1/2 left-1/2 max-h-[50%] max-w-[50%] -translate-x-1/2 -translate-y-1/2"
  />
</div>
