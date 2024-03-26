<script lang="ts">
  import LiveTimeSince from "$lib/components/LiveTimeSince.svelte";
  import { page } from "$app/stores";
  import type { Ping } from "@prisma/client";
  export let ping: Pick<
    Ping,
    "count" | "fromMemberId" | "fromSentAt" | "toSentAt"
  > | null;
</script>

<form method="POST" action="?/ping">
  <!-- Button is disabled for the user who sent the last ping -->
  <button
    class="btn"
    disabled={ping?.fromMemberId == $page.data.user?.memberId
      ? ping?.toSentAt == null || ping?.fromSentAt > ping?.toSentAt
      : ping?.toSentAt != null && ping?.toSentAt > ping?.fromSentAt}
  >
    Ping
  </button>
</form>
{#if ping}
  <div class="flex flex-col justify-center gap-1">
    <span class="text-xs text-gray-500">
      {ping.count} ping{(ping.count ?? 0) > 1 ? "s" : ""}
    </span>
    <span class="text-xs text-gray-500">
      <LiveTimeSince timeStamp={(ping.toSentAt ?? ping.fromSentAt).getTime()} />
    </span>
  </div>
{/if}
