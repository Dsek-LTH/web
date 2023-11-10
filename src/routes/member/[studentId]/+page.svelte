<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import ClassBadge from "$lib/components/ClassBadge.svelte";
  import CommitteIcon from "$lib/components/CommitteIcon.svelte";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { getFullName } from "$lib/utils/member";
  import { _classProgrammes } from "./data";

  export let data;
  export let form;
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
  $: canEdit = isMe || data.accessPolicies.includes(apiNames.MEMBER.UPDATE);
  let isEditing = false;
</script>

<svelte:head>
  <title>{getFullName(member)} | D-sektionen</title>
</svelte:head>
<article class="grid grid-cols-5 gap-x-4" id="container">
  <div class="col-span-2 row-span-3 sm:col-span-1">
    <MemberAvatar {member} size={null} rounded="rounded-lg" />
  </div>
  <header class="col-span-3 mb-4 gap-1 sm:col-span-4">
    <div class="flex items-center">
      <div class="flex-1">
        <h1 class="text-3xl font-bold">{getFullName(member)}</h1>
      </div>
      {#if canEdit}
        <button
          class="btn btn-secondary"
          on:click={() => {
            isEditing = !isEditing;
          }}
        >
          {isEditing ? "Spara" : "Redigera"}
        </button>
      {/if}
    </div>
    {member.studentId}
  </header>
  <div class={isEditing ? "col-span-4 row-span-2" : "col-span-2"}>
    {#if isEditing}
      <!-- Update user form -->
      <form
        id="edit-member"
        method="POST"
        action="?/update"
        use:enhance={() =>
          async ({ update }) => {
            await update({ reset: false });
            isEditing = false;
          }}
        class="form-control gap-2"
      >
        <div class="flex gap-2 [&>*]:flex-1">
          <Input
            name="firstName"
            label="First name"
            value={form?.data?.firstName ?? member.firstName}
          />
          <Input name="nickname" label="Nickname" value={form?.data?.nickname ?? member.nickname} />
          <Input
            name="lastName"
            label="Last name"
            value={form?.data?.lastName ?? member.lastName}
          />
        </div>
        <div class="flex gap-2 [&>*:nth-child(3)]:flex-1">
          <Labeled label="Program" id="classProgramme">
            <select
              id="classProgramme"
              name="classProgramme"
              class="select select-bordered w-full max-w-xs"
              value={form?.data?.classProgramme ?? member.classProgramme ?? "D"}
              required
            >
              {#each _classProgrammes as programme (programme.id)}
                <option value={programme.id}>{programme.name}</option>
              {/each}
            </select>
          </Labeled>
          <Labeled label="Year" id="classProgramme">
            <input
              type="number"
              min="1982"
              max={new Date().getFullYear()}
              name="classYear"
              id="classYear"
              class="input input-bordered"
              value={form?.data?.classYear ?? member.classYear ?? new Date().getFullYear()}
            />
          </Labeled>
          <Input
            name="foodPreference"
            label="Matpreferens"
            value={form?.data?.foodPreference ?? member.foodPreference ?? ""}
          />
        </div>
        <button type="submit" class="btn btn-secondary mt-4">Spara</button>
        {#if form?.error}
          <span class="text-error">{form.error}</span>
        {/if}
      </form>
      <!-- End Update user form -->
    {:else}
      <ClassBadge {member} size="xl" />
    {/if}
  </div>
  {#if member.bio}
    <article class="col-span-5 row-start-4 md:col-span-3">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <MarkdownBody body={member.bio}>
        <div slot="before-body" class="float-right">
          <a href="{$page.params.studentId}/edit-bio" class="btn btn-secondary btn-outline btn-sm"
            >Redigera bio</a
          >
        </div>
      </MarkdownBody>
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
