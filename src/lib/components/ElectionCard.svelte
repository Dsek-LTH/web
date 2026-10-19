<script lang="ts">
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { Button } from "$lib/components/ui/button";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import Pen from "@lucide/svelte/icons/pen";
  import type { AuthUser } from "@zenstackhq/runtime";
  import dayjs from "dayjs";
  import utc from "dayjs/plugin/utc";
  import timezone from "dayjs/plugin/timezone";
  import { breakName } from "$lib/utils/committee";

  dayjs.extend(utc);
  dayjs.extend(timezone);

  let {
    election,
    user,
    index,
  }: {
    election: ExtendedPrismaModel<"Election"> & {
      committee?: Pick<
        ExtendedPrismaModel<"Committee">,
        | "id"
        | "name"
        | "nameSv"
        | "nameEn"
        | "darkImageUrl"
        | "lightImageUrl"
        | "monoImageUrl"
      >;
    };
    user?: AuthUser;
    index?: number;
  } = $props();
</script>

<div
  class="bg-muted-background animate-in fade-in fill-mode-backwards slide-in-from-bottom-[1rem] relative flex flex-col items-center gap-1 rounded-md border-[1px] p-4 duration-300"
  style="animation-delay:{(index ?? 0) * 50}ms"
>
  {#if isAuthorized(apiNames.ELECTION.UPDATE, user)}
    <Button
      href={"/elections/" + election.id + "/edit"}
      class="absolute top-2 right-2"
      size="icon-sm"
      variant="lila"
      ><Pen />
    </Button>
  {/if}

  <div class="w-5/12 self-center text-center">
    <CommitteeIcon committee={election.committee ?? null} />
  </div>

  <h3 class="text-center">
    <!-- eslint-disable-next-line svelte/no-at-html-tags Already sanitized -->
    {@html breakName(election.committee?.name ?? "")}
  </h3>

  <MarkdownBody class="self-start" body={election.markdown} />

  <div class="mt-auto flex flex-col gap-2">
    <p>
      {m.elections_close()}
      {dayjs(election.expiresAt).tz(dayjs.tz.guess()).format("YYYY-MM-DD")}
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
