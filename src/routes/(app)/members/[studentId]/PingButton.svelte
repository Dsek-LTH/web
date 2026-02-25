<script lang="ts">
	import { page } from "$app/stores";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
	import * as m from "$paraglide/messages";
	export let ping: Pick<
		ExtendedPrismaModel<"Ping">,
		"count" | "fromMemberId" | "fromSentAt" | "toSentAt"
	> | null;
</script>

<form method="POST" action="?/ping">
	<!-- Button is disabled for the user who sent the last ping -->
	<button
		class="btn flex w-full flex-col"
		disabled={ping?.fromMemberId == $page.data.user?.memberId
			? ping?.toSentAt == null || ping?.fromSentAt > ping?.toSentAt
			: ping?.toSentAt != null && ping?.toSentAt > ping?.fromSentAt}
	>
		Ping
		{#if ping}
			<div class="-mt-2 text-xs opacity-50">
				{(ping.count ?? 0) === 1
					? m.members_onePing()
					: m.members_pings({ x: ping.count ?? 0 })}
			</div>
		{/if}
	</button>
</form>
