<script lang="ts">
  import HomeCalendar from "$lib/components/homeCalendar/HomeCalendar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import BookOpen from "@lucide/svelte/icons/book-open";
  import UsersRound from "@lucide/svelte/icons/users-round";
  import CircleUserRound from "@lucide/svelte/icons/circle-user-round";
  import Coffee from "@lucide/svelte/icons/coffee";

  import dayjs from "dayjs";
  import { signIn } from "$lib/utils/auth";

  import utc from "dayjs/plugin/utc";
  import timezone from "dayjs/plugin/timezone";
  import { m } from "$paraglide/messages";
  import ArticleSmallCard from "$lib/components/ArticleSmallCard.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import { page } from "$app/state";
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";

  dayjs.extend(utc);
  dayjs.extend(timezone);
  const { data } = $props();

  let isLoggingIn = $state(false);
</script>

<div class="layout-container">
  <div class="flex flex-col gap-8">
    <div class="flex flex-col justify-between gap-6">
      {#if page.data.member}<div class="flex flex-row items-center gap-3">
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
        </div>{:else}
        <div class="flex flex-col gap-4">
          <h2>
            {m.home_welcome_to()} &shy;<span class="break-keep"
              >{m.the_d_guild()}!</span
            >
          </h2>
          <Button
            aria-label="sign in"
            variant="outline"
            class={isLoggingIn ? "text-muted-foreground" : "text-foreground"}
            onclick={() => {
              isLoggingIn = true;
              signIn();
            }}
          >
            {#if isLoggingIn}
              <Spinner class="-ml-2 size-6" />
            {:else}
              <CircleUserRound class="-ml-2 size-6" />
            {/if}
            {m.navbar_logIn()}
          </Button>
        </div>
        <hr />
      {/if}
      <div class="flex flex-col items-start justify-start">
        <div class="grid grid-cols-2 gap-2">
          <div class="flex min-w-0 flex-col">
            <span class="p-2 font-light">{data.well_being}</span>
            <Button
              variant="outline"
              class="h-auto w-full whitespace-normal"
              href="https://bit.ly/trivselkontakt"
            >
              <UsersRound class="shrink-0" />{m.home_contactWellBeing()}
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
        </div>
      </div>
    </div>

    <Button variant="outline" size="lg" href="/committees/cafe">
      <Coffee class="text-primary" />
      {m.home_cafeOpenHours()}:
      <span class=" font-bold">{data.cafeOpen?.markdown}</span>
    </Button>

    <div>
      <h2>
        <a class="hover:text-muted-foreground transition-colors" href="/news"
          >{m.news()}</a
        >
      </h2>
      <div class="mt-4 flex flex-col gap-4 lg:flex-row">
        {#each data.news.slice(0, 3) as newsArticle (newsArticle.id)}
          <ArticleSmallCard
            article={{
              slug: newsArticle.slug,
              header: newsArticle.header,
              publishedAt: newsArticle.publishedAt,
              committee: newsArticle.committee,
              imageUrl: newsArticle.imageUrl,
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
      <div class="mt-2 flex">
        <Button variant="outline" class="w-full" href="/news"
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
          startDate: e.startDatetime,
          endDate: e.endDatetime,
          slug: e.slug ?? "",
          title: e.title,
        }))}
      />
    </div>
  </div>
</div>
