<script lang="ts">
  import { page } from "$app/stores";
  import CommitteIcon from "$lib/components/CommitteIcon.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/member.js";
  import ClassBadge from "$lib/components/ClassBadge.svelte";

  export let data;
  $: member = data.member;
  $: isMe = data.session?.user?.student_id === $page.params.studentId;
  $: mandatesGroupedByYear = member.mandates.reduce(
    (acc, mandate) => {
      let year = mandate.startDate.getFullYear().toString();
      if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
        year += `-${mandate.endDate.getFullYear()}`;
      if (!acc[year]) acc[year] = [];
      acc[year]!.push(mandate);
      return acc;
    },
    {} as Record<string, (typeof member)["mandates"]>
  );
  $: years = Object.keys(mandatesGroupedByYear).sort((a, b) => b.localeCompare(a, "sv"));
  $: publishedEvents = [...member.authoredEvents].reverse();
</script>

<svelte:head>
  <title>{getFullName(member)} | D-sektionen</title>
</svelte:head>
<article class="grid grid-cols-5 gap-x-4" id="container">
  <div class="col-span-2 row-span-3 sm:col-span-1">
    <MemberAvatar {member} size={null} rounded="rounded-lg" />
  </div>
  <header class="col-span-3 mb-4 sm:col-span-4">
    <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
    {member.studentId} <br />
  </header>
  <div class="col-span-2">
    <ClassBadge {member} size="xl" />
  </div>
  {#if member.bio}
    <article class="col-span-5 row-start-4 md:col-span-3">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <MarkdownBody body={member.bio} />
    </article>
  {/if}
  <div class="col-span-5 row-span-4 flex flex-col sm:flex-row md:col-span-2 md:flex-col">
    <div class="flex-1 md:flex-grow-0">
      <h2 class="mb-2 text-lg">Innehavda poster</h2>
      {#each years as year}
        <section class="mb-4">
          <h1 class="text-xl font-semibold">{year}</h1>
          <div class="flex flex-col items-stretch gap-0">
            {#each mandatesGroupedByYear[year] ?? [] as mandate (mandate.id)}
              {#if mandate.position}
                <div
                  class="tooltip -mx-4 whitespace-pre"
                  data-tip={mandate.position.committee?.name +
                    `\n${mandate.startDate.toLocaleDateString(
                      "sv"
                    )} - ${mandate.endDate.toLocaleDateString("sv")}`}
                >
                  <a href="/positions/{mandate.position.id}">
                    <button
                      class="btn btn-ghost w-full justify-start gap-2 normal-case text-primary"
                    >
                      {#if mandate.position.committee}
                        <figure class="h-8 w-8 overflow-hidden">
                          <CommitteIcon committee={mandate.position.committee} />
                        </figure>
                      {/if}
                      <span
                        class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
                      >
                        {mandate.position.name}
                      </span>
                    </button>
                  </a>
                </div>
              {/if}
            {/each}
          </div>
        </section>
      {/each}
    </div>
    <div class="flex-1 md:flex-grow-0">
      {#if data.publishedArticles.length > 0}
        <h2 class="mb-2 text-lg">Publicerade nyheter</h2>
        <div class="mb-4 flex flex-col gap-2">
          {#each data.publishedArticles as article (article.id)}
            <a
              href="/news/{article.slug}"
              class="btn grid grid-cols-[1fr_auto] justify-between normal-case"
            >
              <h1 class="overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium">
                {article.header}
              </h1>
              <div>
                <span class="text-xs font-bold opacity-50"
                  >{article.publishedAt?.toLocaleDateString("sv")}</span
                >
              </div>
            </a>
          {/each}
        </div>
      {/if}
      {#if publishedEvents.length > 0}
        <h2 class="mb-2 text-lg">Publicerade evenemang</h2>
        <div class="flex flex-col gap-2">
          {#each publishedEvents as event (event.id)}
            <a
              href="/events/{event.slug}"
              class="btn grid grid-cols-[1fr_auto] justify-between normal-case"
            >
              <h1 class="overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium">
                {event.title}
              </h1>
              <div>
                <span class="text-xs font-bold opacity-50">
                  {event.startDatetime?.toLocaleDateString("sv")}
                </span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</article>
