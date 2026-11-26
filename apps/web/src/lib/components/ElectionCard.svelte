<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { Button } from "$lib/components/ui/button";
  import type { components } from "$lib/api/schema";
  import apiNames from "$lib/utils/apiNames";
  import * as m from "$paraglide/messages";
  import Pen from "@lucide/svelte/icons/pen";
  import type { AuthUser } from "$lib/auth/types";
  import { breakName } from "$lib/utils/committee";
  import { toAppTime } from "$lib/utils/datetime";

  type Election = components["schemas"]["Election"];

  let {
    election,
    user,
    index,
  }: {
    election: Pick<
      Election,
      "id" | "markdown" | "link" | "expiresAt" | "committee"
    >;
    user?: AuthUser;
    index?: number;
  } = $props();
</script>

<div
  class="bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[1rem] relative flex flex-col items-center gap-1 rounded-md border-[1px] p-4 duration-300"
  style="animation-delay:{(index ?? 0) * 50}ms"
>
  {#if user?.policies.includes(apiNames.ELECTION.UPDATE)}
    <Button
      href={"/elections/" + election.id + "/edit"}
      class="absolute top-2 right-2"
      size="icon-sm"
      variant="lila"
      ><Pen />
    </Button>
  {/if}

  <div class="w-5/12 self-center text-center">
    <CommitteeIcon committee={election.committee} />
  </div>

  <h3 class="text-center">
    <!-- eslint-disable-next-line svelte/no-at-html-tags Already sanitized -->
    {@html breakName(election.committee.name)}
  </h3>

  <MarkdownBody class="self-start" body={election.markdown} />

  <div class="mt-auto flex flex-col gap-2">
    <p>
      {m.elections_close()}
      {toAppTime(election.expiresAt).format("YYYY-MM-DD")}
    </p>
    <div>
      <Button
        href={election.link}
        target="_blank"
        rel="noreferrer"
        class="w-full"
      >
        {m.elections_apply()}
      </Button>
    </div>
  </div>
</div>
