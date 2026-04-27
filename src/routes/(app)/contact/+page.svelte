<script lang="ts">
  import type { PageData } from "./$types";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import * as m from "$paraglide/messages";
  import { type ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import MemberAvatar from "$lib/components/MemberAvatar.svelte";

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

  <div class="flex flex-col gap-2 rounded-md bg-black p-4 text-white">
    <div class="flex flex-row items-center gap-3">
      <svg
        width="48px"
        height="48px"
        viewBox="0 0 636 599"
        color="#FFFFFF"
        fill="#fff"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xml:space="preserve"
        style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
      >
        <g transform="matrix(1,0,0,1,-47.022574,-834.387208)">
          <g>
            <rect
              id="Artboard1"
              x="0"
              y="0"
              width="2500"
              height="2500"
              style="fill:none;"
            />
            <g
              transform="matrix(0.74219,0.428504,-0.428504,0.74219,-65.528367,-232.763917)"
            >
              <path
                d="M1023,1504.507L1023,1191.076C1023,1184.833 1026.304,1179.056 1031.685,1175.891L1116.315,1126.109C1121.696,1122.944 1125,1117.167 1125,1110.924L1125,798.493C1125,792.201 1128.356,786.386 1133.804,783.239C1139.252,780.091 1145.966,780.088 1151.417,783.231L1423.182,939.916C1428.638,943.062 1432,948.881 1432,955.178L1432,1052.822C1432,1059.119 1435.362,1064.938 1440.818,1068.084L1712.528,1224.738C1717.984,1227.883 1721.346,1233.702 1721.346,1240C1721.346,1246.298 1717.984,1252.117 1712.528,1255.262L1440.814,1411.918C1435.36,1415.063 1428.643,1415.058 1423.193,1411.906L1338.807,1363.094C1333.357,1359.942 1326.64,1359.937 1321.186,1363.082L1049.417,1519.769C1043.966,1522.912 1037.252,1522.909 1031.804,1519.761C1026.356,1516.614 1023,1510.799 1023,1504.507ZM1205.289,995.578C1199.841,992.434 1193.131,992.432 1187.682,995.575C1182.233,998.717 1178.872,1004.525 1178.865,1010.815L1178.447,1362.064C1178.439,1368.348 1181.78,1374.161 1187.213,1377.318C1192.646,1380.475 1199.35,1380.499 1204.806,1377.381L1510.781,1202.5C1516.258,1199.37 1519.643,1193.55 1519.656,1187.242C1519.67,1180.934 1516.309,1175.1 1510.846,1171.946L1205.289,995.578Z"
              />
            </g>
          </g>
        </g>
      </svg>
      <h3>DELTA</h3>
    </div>
    <span>
      {m.contact_teknikfokus_prose()}
    </span>
    <span
      >{m.contact_delta_email()}<a
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
