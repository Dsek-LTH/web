<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import { getInitials } from "$lib/utils/client/member";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import type { PageData } from "./$types";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  import * as m from "$paraglide/messages";
  import { type ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  let { data }: { data: PageData } = $props();

  let { vordf, ordf, nara } = $derived(data);
</script>

<div class="layout-container flex flex-col gap-8">
  <h1>{m.contact_contact()}</h1>

  <div class="flex flex-col">
    <div class="flex flex-row justify-around gap-4">
      {@render positionCard(vordf, m.contact_vice_president())}
      {@render positionCard(ordf, m.contact_president())}
      {@render positionCard(nara, m.contact_business())}
    </div>
  </div>

  <div class="text-background flex flex-col gap-2 rounded-md bg-[#14273e] p-4">
    <div class="flex flex-row items-center gap-1">
      <svg
        class="w-16"
        fill="#ffffff"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        ><path
          d="M487.5,906.2c-84.3-2.7-164-30.5-231.2-80.8c-50.1-37.5-91.1-86.5-119.2-142.3
	c-23.6-46.9-36.9-94.1-41.9-148.9l-0.2-2.3h25.3c13.9,0,25.3,0.2,25.3,0.4c0,1.9,2.3,19.4,3.4,26.3c7.7,46.5,25.2,92.4,50.1,131.5
	l2.4,3.7l30-22.7c16.5-12.5,30.3-22.9,30.6-23.3c0.5-0.5-0.1-1.7-2.3-5.7c-33.1-57.4-45.1-124.3-34.1-190.2
	c9.6-57.3,35.9-109,77.4-151.8l6.8-7L287.9,264c-12.1-16-22.1-29.2-22.4-29.2c-1.1,0-20.6,19.1-29.4,28.8
	c-49.5,54.6-81.1,123.9-89.3,195.4c-0.4,3.8-0.9,7.8-1,8.9l-0.3,2.1h-25.2H95l0.2-2.1c0.1-1.1,0.6-6.1,1.1-11.1
	c8.2-76.6,38.6-149.4,87.4-209.8c29-35.9,64.7-67.3,103.8-91.2c74.9-45.9,162.5-66.2,250.4-57.9c87.7,8.2,169.5,44.3,234.9,103.7
	c18.8,17.1,37.1,37.3,52.5,57.9c46.5,62.4,74.3,137.3,79.2,213.5c0.3,4.4,0.6,9.5,0.7,11.3l0.2,3.3H752.3H599.2l-0.2-1.1
	c-0.1-0.6-0.7-3.7-1.2-6.8c-6.2-34.6-30.4-64.6-62.4-77.4c-10.8-4.3-20.4-6.3-32.3-6.7c-29.5-1.1-57.6,11.3-77.4,34.2
	c-6.2,7.1-10.7,14-15,22.9c-5.6,11.4-7.8,18.8-10.3,34.3l-0.3,1.6H375h-25.2l0.3-4.3c0.5-5.7,2.4-16.8,3.9-23.1
	c11.2-44.1,40.2-80.6,79.7-100.5c22.4-11.2,44.6-16.1,70.2-15.4c16.1,0.4,29.2,2.8,43.9,7.9c21.5,7.5,39.9,19.1,56.4,35.6
	c13.2,13.1,23.8,28.3,31.2,44.6l2.6,5.6l105.7,0.1c104.6,0.1,105.7,0.1,105.7-0.8c0-1.4-2.7-14.4-4.7-22.2
	c-7.1-28.3-17.5-55.5-30.8-80.5c-55.8-104.7-159.6-175-276.7-187.3c-23.4-2.5-51.2-2.5-74.9,0c-54.5,5.6-108.9,24.8-154.7,54.5
	l-3.5,2.3l21.5,28.6c11.8,15.7,21.7,28.8,21.9,29c0.2,0.2,3-1.2,6.1-3.2c9.8-6.1,16.1-9.6,26.3-14.5c46.9-22.8,98.9-31.7,151-25.8
	c101.9,11.5,189.2,79.3,227.4,176.5c1.3,3.3,2.4,6.2,2.4,6.5c0,0.2-12.2,0.4-27,0.4h-27l-3.4-7c-33-66.6-95.5-113.3-167.5-125
	c-19.9-3.2-43.1-3.7-63.8-1.2c-57,6.8-111.5,37.5-148.6,83.8c-50.2,62.7-64.7,146.6-38.5,222.9c19.9,57.8,62.3,106,116.6,132.6
	c26.1,12.7,52.1,19.8,82.4,22.2c8.9,0.7,32,0.3,40.7-0.8c52.9-6.5,98.9-29,135.9-66.7c17.4-17.7,31.1-36.8,41.5-57.6l2.9-5.7h27.4
	h27.4l-1,2.6c-21.5,54.9-58.5,100.9-106.8,133.1c-34.3,22.8-73.5,37.8-113.7,43.3c-14.4,2-18.9,2.3-38.5,2.3
	c-23.1,0-34.3-1-52.9-4.7c-57.5-11.4-108.5-39.9-149.3-83.5c-3.8-4-6.5-6.5-6.8-6.3c-0.3,0.2-14,10.5-30.4,23l-29.9,22.6l3.5,4
	c10.3,11.6,26.2,27,38.7,37.3c53.9,44.9,120.5,73.1,189.7,80.3c23.7,2.5,51.5,2.5,74.9,0c73.9-7.8,143.7-38.8,199.7-88.9
	c49.3-44.1,86-102.3,104.2-165.4c3.3-11.4,8.3-32.8,8.3-35.4c0-0.6-13.6-0.7-106.3-0.7H636.8l-2.7,5.5c-10.6,21.7-26.4,41-45.5,55.3
	c-54.5,41-129.1,39.7-181.8-3.2c-17.5-14.2-30.9-31.1-41-51.5c-7.7-15.7-12.4-30.4-14.6-46.3c-0.4-3-0.9-6-1-6.7l-0.2-1.3l25.4,0.1
	l25.4,0.1l1.2,5.9c3.2,16,11.1,32.8,21.5,45.6c3.9,4.8,13.1,13.7,17.8,17.2c15.5,11.5,32.3,17.9,51.7,19.5
	c27,2.3,55.6-8.6,75.6-28.5c14.2-14.2,24.8-33.6,28.7-52.5c0.6-2.8,1.1-5.6,1.3-6.2l0.2-1.1h153.3h153.3l-0.2,3
	c-1.9,32.7-5,53.7-11.5,80c-15.7,63.3-45.8,120.8-89.6,170.8c-6.6,7.6-27.9,28.9-35.4,35.4c-45.6,39.9-95.6,67.7-152.7,84.8
	C575.7,901.6,529.9,907.5,487.5,906.2L487.5,906.2z"
          class="svelte-1huuocv"
        ></path></svg
      >
      <h4>Teknikfokus</h4>
    </div>
    <span>
      {m.contact_teknikfokus_prose()}
    </span>
    <a class="transition-all hover:opacity-80" href="https://teknikfokus.se"
      >www.teknikfokus.se <ExternalLink class="mb-[4px] inline h-[0.8lh]" /></a
    >
  </div>

  <div class="flex flex-row justify-between gap-4">
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
            : ""}</span
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
            : ""}</span
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
  <div class="flex w-64 flex-col rounded-md border-[1px] p-4">
    <Avatar.Root class="border-border m-3 size-40 self-center border-[1px]">
      <Avatar.Image
        src={position?.member?.picturePath ?? ""}
        alt="Member image"
      />
      <Avatar.Fallback class="text-xl"
        >{getInitials(position?.member)}</Avatar.Fallback
      >
    </Avatar.Root>
    <h3>{position?.position.name}</h3>
    <h6>{position?.member?.firstName} {position?.member?.lastName}</h6>
    <div class="mt-3">
      <span>{description}</span>
      <a class="link mt-2 break-words" href="mailto:{position?.position.email}"
        >{position?.position.email}</a
      >
    </div>
  </div>
{/snippet}
