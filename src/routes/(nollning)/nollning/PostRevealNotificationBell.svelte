<script lang="ts">
  import { POST_REVEAL_PREFIX } from "./routes";

  export let unreadCount = 0;
</script>

<div class="indicator">
  {#if unreadCount > 0}
    <span
      class="translate badge indicator-item badge-primary badge-xs translate-x-0 translate-y-0"
    ></span>
  {/if}
  <a
    href={`${POST_REVEAL_PREFIX}/notifications`}
    class="btn btn-circle relative aspect-square size-10 !p-0"
  >
    <span class="i-mdi-bell-outline size-7" />
  </a>
</div>
