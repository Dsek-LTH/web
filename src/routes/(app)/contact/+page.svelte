<script lang="ts">
  import type { PageData } from "./$types";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import * as m from "$paraglide/messages";
  import { type ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";

  let { data }: { data: PageData } = $props();

  let { vordf, ordf, nara } = $derived(data);
</script>

<div class="layout-container flex flex-col gap-8">
  <h1>{m.contact_contact()}</h1>

  <div class="flex flex-col">
    <div
      class="md-nav:grid md-nav:grid-cols-3 flex flex-col flex-wrap items-center justify-around gap-4 *:justify-self-center sm:flex-row"
    >
      {@render positionCard(vordf, m.contact_vice_president())}
      {@render positionCard(ordf, m.contact_president())}
      {@render positionCard(nara, m.contact_business())}
    </div>
  </div>

  <div class="flex flex-col gap-2 rounded-md bg-[#101828] p-4 text-white">
    <div class="flex flex-row items-center gap-3">
      <span class="text-3xl font-bold"
        ><span class="text-rosa-400">&gt;</span> DELTΔ<span
          class="text-rosa-400 animate-caret-blink">_</span
        ></span
      >
    </div>
    <span>
      {m.contact_delta_prose()}
    </span>
    <span
      >{m.contact_delta_email_pre()}
      <a
        class="underline transition-all hover:opacity-80"
        href="https://delta.dsek.se">delta.dsek.se</a
      >{m.contact_delta_email_after()}<a
        class="underline transition-all hover:opacity-80"
        href="mailto:delta@dsek.se">delta@dsek.se</a
      ></span
    >
  </div>

  <div
    class="flex flex-row flex-wrap items-start justify-center gap-4 lg:justify-between"
  >
    <div class=" flex w-78 flex-col gap-4 rounded-md border-[1px] p-4">
      <div class="flex flex-row items-center justify-between">
        <h3>{data.trivsel?.name}</h3>
        <CommitteeIcon class="w-12 self-baseline" committee={data.trivsel} />
      </div>

      <span>{m.contact_wellbeing()} </span>
      <a class="link" href="https://bit.ly/trivselkontakt"
        >bit.ly/trivselkontakt</a
      >
    </div>

    <div class="flex w-78 flex-col gap-4 rounded-md border-[1px] p-4">
      <div class="flex flex-row items-center justify-between">
        <h3>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html data.cpu?.name.includes("utskottet")
            ? `${data.cpu?.name.split("utskottet")[0]}&shy;utskottet`
            : data.cpu?.name}
        </h3>
        <CommitteeIcon class="w-12 self-baseline" committee={data.cpu} />
      </div>

      <span>{m.contact_pm_prose()}</span>
      <div class="flex flex-col">
        <span class="font-bold">{data.pm?.position?.name ?? ""}</span>
        <span
          >{data.pm
            ? data.pm.member.firstName + " " + data.pm.member.lastName
            : m.vacant()}</span
        >
        <a class="link" href="mailto:{data.pm?.position?.email}"
          >{data.pm?.position?.email ?? ""}</a
        >
      </div>

      <span>{m.contact_root_prose()}</span>
      <div class="flex flex-col">
        <span class="font-bold">{data.root?.position?.name ?? ""}</span>
        <span
          >{data.root
            ? data.root.member.firstName + " " + data.root.member.lastName
            : m.vacant()}</span
        >
        <a class="link" href="mailto:{data.root?.position?.email ?? ''}"
          >{data.root?.position?.email ?? ""}</a
        >
      </div>
    </div>
    <div class="flex w-78 flex-col gap-4 rounded-md border-[1px] p-4">
      <div class="flex flex-row items-center justify-between">
        <h3>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.contact_guild_information()}
        </h3>
        <CommitteeSymbol class="w-12 self-baseline" />
      </div>

      <div class="flex flex-col">
        <span class="font-bold">{m.contact_postal_address()}</span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span>{@html m.nav_postal_address()}</span>
      </div>

      <div class="flex flex-col">
        <span class="font-bold">{m.contact_visitor_address()}</span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span>{@html m.nav_visitor_address()}</span>
      </div>

      <div class="flex flex-col">
        <span class="font-bold">{m.contact_organization_number()}</span>
        <span>805003-2878</span>
      </div>

      <div class="flex flex-col">
        <span class="font-bold">{m.contact_media()}</span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span>{@html m.contact_media_prose()}</span>
        <a href="mailto:ko@tlth.se" class="link">ko@tlth.se</a>
      </div>
    </div>
  </div>
</div>

{#snippet positionCard(
  position:
    | (ExtendedPrismaModel<"Mandate"> & {
        position: ExtendedPrismaModel<"Position">;
        member: ExtendedPrismaModel<"Member">;
      })
    | null,
  description: string,
)}
  {#if position}
    <div class="flex h-full w-72 flex-col rounded-md border-[1px] p-4 sm:w-64">
      <MemberAvatar
        member={position?.member}
        class="border-border m-3 size-40 self-center border-[1px]"
      />
      <h3>{position?.position.name}</h3>
      <h6>{position?.member?.firstName} {position?.member?.lastName}</h6>
      <div class="mt-3">
        <span>{description}</span>
        <a
          class="link mt-2 break-words"
          href="mailto:{position?.position.email}">{position?.position.email}</a
        >
      </div>
    </div>
  {/if}
{/snippet}
