<script lang="ts">
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card/index";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Coffee from "@lucide/svelte/icons/coffee";
  import UsersRound from "@lucide/svelte/icons/users-round";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Cake from "@lucide/svelte/icons/cake";
  import { m } from "$paraglide/messages";
  import { toAppTime } from "$lib/utils/datetime";
  import ArticleSmallCard from "$lib/components/ArticleSmallCard.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import Documents from "./Documents.svelte";
  const { data } = $props();
</script>

<div class="flex flex-col gap-12">
  <div class="flex flex-col justify-between gap-6 lg:flex-row">
    <div class="flex flex-col items-start justify-start">
      <div class="flex flex-row items-center justify-between gap-3">
        <MemberAvatar member={data.member!} class="size-14" />
        <div class="flex flex-col">
          <h1 class="font-sans whitespace-nowrap">
            {m.home_greeting({ name: data.member?.firstName ?? "" })}
          </h1>
          {#await data.unreadCountPromise}
            {m.home_notificationCount({ count: 0 })}
          {:then count}
            {m.home_notificationCount({ count: count ?? 0 })}
          {/await}
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 pt-2">
        <div class="flex min-w-0 flex-col">
          <span class="p-2 font-light">{data.wellbeing}</span>
          <Button
            variant="outline"
            class="h-auto w-full whitespace-normal"
            href="https://bit.ly/trivselkontakt"
          >
            <UsersRound class="shrink-0" />{m.home_contactWellbeing()}
          </Button>
        </div>
        <div class="flex min-w-0 flex-col">
          <span class="p-2 font-light">{m.home_feedbackSRD()}</span>
          <Button
            variant="outline"
            class="h-auto w-full whitespace-normal"
            href="mailto:srdordforande@dsek.se"
          >
            <BookOpen class="shrink-0" />{m.home_contactSRD()}
          </Button>
        </div>
        <Button
          variant="outline"
          size="lg"
          class="col-span-2 mt-2 w-fit sm:col-span-1"
          href="/committees/cafe"
        >
          <Coffee class="text-primary" />
          {m.home_cafeOpenHours()}:
          <span class="font-bold">{data.cafeOpen?.markdown}</span>
        </Button>
      </div>
    </div>
    {#if data.elections.length > 0}
      <div>
        <a href="/elections" class="hover:underline">
          <h3 class="flex flex-row items-center">
            {m.openElections()}<ArrowRight />
          </h3>
        </a>
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
                {toAppTime(election.expiresAt).format("YYYY-MM-DD")}</span
              >
              <Button href={election.link} class="mt-4"
                >{m.elections_apply()}</Button
              >
            </Card.Root>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div>
    <h2>
      <a class="hover:text-muted-foreground transition-colors" href="/news"
        >{m.news()}</a
      >
    </h2>
    <div class="mt-4 flex flex-col gap-4 lg:flex-row">
      {#each data.news as newsArticle (newsArticle.id)}
        <ArticleSmallCard
          article={{
            slug: newsArticle.slug,
            header: newsArticle.header,
            publishedAt: newsArticle.publishedAt,
            committee: newsArticle.committee,
            imageUrl: newsArticle.imageUrl,
            youtubeUrl: newsArticle.youtubeUrl,
          }}
          isPreview={false}
        />
      {:else}
        <div
          class="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground"
        >
          <span class="font-medium">{m.home_newsEmpty()}</span>
        </div>
      {/each}
    </div>
    <div class="mt-2 flex justify-end">
      <Button variant="outline" size="sm" class="" href="/news"
        >{m.home_more_news()} <ArrowRight /></Button
      >
    </div>
  </div>

  <div>
    <h2>
      <a class="hover:text-muted-foreground transition-colors" href="/events"
        >{m.events()}</a
      >
    </h2>
    <HomeCalendar
      events={data.events.map((e) => ({
        id: e.id,
        startDate: e.startDatetime,
        endDate: e.endDatetime,
        slug: e.slug,
        title: e.title,
      }))}
    />
  </div>

  {#if data.birthdays.length > 0}
    <section
      class="border-rosa-200 dark:border-rosa-900 from-rosa-50 via-background to-lila-100 dark:from-rosa-950/40 dark:to-lila-950/40 relative overflow-hidden rounded-xl border bg-linear-to-br p-5"
    >
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <span
          class="birthday-float absolute top-3 left-6 text-xl"
          style:animation-delay="0ms">🎈</span
        >
        <span
          class="birthday-float absolute top-5 right-8 text-lg"
          style:animation-delay="600ms">🎉</span
        >
        <span
          class="birthday-float absolute bottom-2 left-1/3 text-lg"
          style:animation-delay="1200ms">✨</span
        >
        <span
          class="birthday-float absolute right-1/4 bottom-4 text-lg"
          style:animation-delay="1800ms">🎂</span
        >
      </div>
      <div class="relative">
        <h2 class="flex items-center gap-2 text-lg">
          <Cake class="text-rosa-500 size-5" />
          {m.home_birthdaysToday()}
          <span class="bg-rosa-500 rounded-full px-2 py-0.5 text-xs text-white"
            >🎉</span
          >
        </h2>
        <ul class="mt-3 flex flex-wrap gap-2">
          {#each data.birthdays as birthday (birthday.id)}
            {@const href = birthday.studentId
              ? `/members/${birthday.studentId}`
              : "/members"}
            <li>
              <a
                {href}
                class="border-rosa-200/70 bg-background/80 hover:border-rosa-400 dark:border-rosa-800 group flex items-center gap-2 rounded-full border px-2 py-1 pr-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <MemberAvatar member={birthday} class="size-7" />
                <span class="font-medium">{getFullName(birthday)}</span>
                <span class="transition-transform group-hover:rotate-12"
                  >🎂</span
                >
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </section>
  {/if}

  <Documents files={data.files} />
</div>

<style>
  .birthday-float {
    animation: birthday-float 4s ease-in-out infinite;
  }

  @keyframes birthday-float {
    0%,
    100% {
      transform: translateY(0) rotate(-6deg);
    }
    50% {
      transform: translateY(-8px) rotate(6deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .birthday-float {
      animation: none;
    }
  }
</style>
