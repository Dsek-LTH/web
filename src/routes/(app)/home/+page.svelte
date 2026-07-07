<script lang="ts">
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index";
  import { BookOpen, UsersRound } from "@lucide/svelte";
  import dayjs from "dayjs";
  import utc from "dayjs/plugin/utc";
  import timezone from "dayjs/plugin/timezone";
  import { m } from "$paraglide/messages";
  import CommitteePlaceholder from "$lib/components/images/CommitteePlaceholder.svelte";
  import CommitteeSymbol from "$lib/components/images/CommitteeSymbol.svelte";
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const { data } = $props();
</script>

<div class="flex flex-col justify-between gap-6 lg:flex-row">
  <div class="flex flex-col items-start justify-center">
    <div class="flex flex-row items-center justify-between gap-3">
      <MemberAvatar member={data.member!} class="size-14" />
      <div class="flex flex-col">
        <h1 class="font-sans whitespace-nowrap">
          {m.home_greeting({ name: data.member?.firstName ?? "" })}
        </h1>
        {#await data.notificationsPromise}
          {m.home_notificationCount({ count: 0 })}
        {:then notifications}
          {m.home_notificationCount({
            count: notifications?.filter((n) => n.readAt === null).length ?? 0,
          })}
        {/await}
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2 pt-2">
      <div class="flex min-w-0 flex-col">
        <span class="p-2 font-light">{data.wellbeing}</span>
        <Button variant="outline" class="h-auto w-full whitespace-normal"
          ><UsersRound class="shrink-0" />{m.home_contactWellbeing()}</Button
        >
      </div>
      <div class="flex min-w-0 flex-col">
        <span class="p-2 font-light">{m.home_feedbackSRD()}</span>
        <Button variant="outline" class="h-auto w-full whitespace-normal"
          ><BookOpen class="shrink-0" />{m.home_contactSRD()}</Button
        >
      </div>
    </div>
  </div>
  <div>
    <h3>{m.openElections()}</h3>
    <div class="mt-2 grid grid-cols-2 gap-4 sm:flex sm:flex-row">
      {#each data.elections as election, i (election.id)}
        <Card.Root
          class={[
            "flex flex-col items-center gap-0 p-4 sm:w-1/3 lg:w-50",
            i >= 2 && "hidden sm:flex",
          ]}
        >
          <CommitteeIcon committee={election.committee} class="size-24" />
          <h5 class="w-full truncate py-2 text-center">
            {election.committee.name}
          </h5>
          <span class="w-full text-center font-light">
            {m.elections_close()}
            {dayjs(election.expiresAt)
              .tz(dayjs.tz.guess())
              .format("YYYY-MM-DD")}</span
          >
          <Button href={election.link} class="mt-4"
            >{m.elections_apply()}</Button
          >
        </Card.Root>
      {:else}
        <div
          class="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground"
        >
          <span class="font-medium">{m.home_electionsEmpty()}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<div>
  <h2>{m.events()}</h2>
  <HomeCalendar
    events={data.events.map((e) => ({
      startDate: e.startDatetime,
      endDate: e.endDatetime,
      slug: e.slug ?? "",
      title: e.title,
    }))}
  />
</div>
<div>
  <h2>{m.news()}</h2>
  <div class="mt-4 flex flex-col gap-4 lg:flex-row">
    {#each data.news as newsArticle, i (newsArticle.id)}
      <a
        href="/news/{newsArticle.slug}"
        class={[
          "relative aspect-2/1 w-full overflow-hidden rounded-xl hover:underline lg:w-1/3",
          i >= 2 && "hidden lg:block",
        ]}
      >
        {#if newsArticle.imageUrl}
          <div
            class="absolute inset-0 bg-cover bg-center"
            style="background-image: url({newsArticle.imageUrl});"
          ></div>
          <div class="absolute top-2 right-2 size-14 p-3">
            <CommitteeSymbol
              committee={newsArticle.committee ?? undefined}
              class="size-8"
            />
          </div>
          <div
            class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent"
          ></div>
        {:else}
          <CommitteePlaceholder
            class="absolute inset-0"
            committee={newsArticle.committee}
          />
        {/if}
        <div
          class={[
            "relative flex h-full w-full flex-col justify-end p-4",
            newsArticle.imageUrl && "text-white",
          ]}
        >
          <h2 class="line-clamp-2 overflow-hidden">
            {newsArticle.header}
          </h2>
          <span class="text-right font-light">
            {dayjs(newsArticle.publishedAt).format("YYYY-MM-DD")}
          </span>
        </div>
      </a>
    {/each}
  </div>
</div>
