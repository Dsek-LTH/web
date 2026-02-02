<script lang="ts">
  import PositionCard from "$lib/components/PositionCard.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index";
  import * as Tabs from "$lib/components/ui/tabs/index";
  import { Badge } from "$lib/components/ui/badge";
  import * as m from "$paraglide/messages";
  import { toString, type Semester } from "$lib/utils/semesters";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import MemberBio from "./MemberBio.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import Pen from "@lucide/svelte/icons/pen";
  import Copy from "@lucide/svelte/icons/copy";
  import * as Dialog from "$lib/components/ui/dialog";
  import MemberForm from "./MemberForm.svelte";
  import { cn } from "$lib/utils";
  import dayjs from "dayjs";

  let { data } = $props();

  const member = $derived(data.viewedMember);

  const mandatesByYear = $derived.by(() => {
    const res = Object.groupBy(member.mandates, ({ startDate, endDate }) => {
      // If the mandate spans only one year, show that year, e.g. "2020"
      if (startDate.getFullYear() === endDate.getFullYear()) {
        return startDate.getFullYear().toString();
      }
      // Otherwise, show both years, e.g. "2020-2021"
      return `${startDate.getFullYear()}-${endDate.getFullYear()}`;
    });

    if (member.nollaIn) {
      res[member.nollaIn.year] ??= [];
    }

    return res;
  });

  const medals = $derived(data.medals);
  const getMedalLink = (semester: Semester) =>
    `/medals?semester=${toString(semester)}`;

  const programmeColors: Record<
    string,
    "rosa" | "lila" | "pistachio" | "outline"
  > = {
    D: "rosa",
    C: "lila",
    "VR/AR": "pistachio",
    E: "outline",
    BME: "outline",
    Dokt: "outline",
    "?": "rosa",
  };
</script>

{@render mobile("md:hidden")}

<div class="layout-container hidden flex-row md:flex">
  {@render desktop()}
</div>

{#snippet mobile(klass: string)}
  <div class={klass}>
    <header
      style="background-size:150%;background-image:url(https://files.dsek.se/albums/public/2025/2025-08-27%20L.I.G.G./LIGG59jpg.webp)"
      class="bg-rosa-300 h-44 bg-contain bg-center"
    ></header>
    <section
      class="layout-container bg-muted-background relative flex flex-col border-b-[1px] py-0 pb-4"
    >
      <a href={member.studentId + "/edit"}>
        <Button variant="outline" class="absolute top-2 right-2" size="sm"
          ><Pen /> {m.member_edit_profile()}</Button
        ></a
      >
      <div class="field-sizing-content h-24">
        <Avatar.Root
          class="border-background relative top-[-50%] size-24 border-4"
        >
          <Avatar.Image src={member.picturePath} alt="Member image" />
          <Avatar.Fallback
            >{member.firstName && member.lastName
              ? member.firstName?.charAt(0) + member.lastName?.charAt(0)
              : "NN"}</Avatar.Fallback
          >
        </Avatar.Root>
      </div>
      <span class="-mt-12 flex flex-row items-center gap-0"
        ><code>{member.studentId}</code><Button
          onclick={() => navigator.clipboard.writeText(member.studentId ?? "")}
          variant="ghost"
          size="icon-sm"><Copy /></Button
        ></span
      >
      <div class="flex flex-row items-center gap-2">
        <h3>{member.firstName} {member.lastName}</h3>
        <Badge variant={programmeColors[member.classProgramme ?? "?"] ?? "rosa"}
          >{(member.classProgramme ?? "?") +
            (member.classYear?.toString().slice(-2) ?? "??")}</Badge
        >
      </div>
      <p class="text-rosa-500 mt-0">"{member.nickname}"</p>
      {#if member.bio}
        <h6 class="mt-1">Bio</h6>
        <MemberBio bio={member.bio} />
      {/if}
    </section>
    <section class="layout-container flex flex-col gap-8 py-4">
      <div class="flex flex-col items-baseline">
        {#if Object.keys(mandatesByYear).length > 0}
          <h2 class="self-center">{m.positions()}</h2>
          {#each Object.entries(mandatesByYear)
            .toSorted()
            .toReversed() as [year, mandates] (year)}
            <div
              class="animate-in slide-in-from-bottom-[1rem] pl-6 duration-400"
              style="animation-delay: {(new Date().getFullYear() -
                parseInt(year)) *
                25 +
                50}ms"
            >
              <h5 class="my-2">{year}</h5>
              <!-- This if-statement is just to make TypeScript happy. -->
              {#if mandates}
                <div class="flex flex-col gap-2">
                  {#each mandates as mandate (mandate.id)}
                    <PositionCard compact {mandate} />
                  {/each}
                </div>
              {/if}

              {#if member.nollaIn?.year.toString() === year}
                <div class="inline-flex flex-row items-center gap-2 rounded-md">
                  <a href="/committees/nollu?year={member.nollaIn.year}">
                    {#if member.nollaIn.imageUrl}
                      <figure class="size-7 overflow-hidden rounded-sm">
                        <img src={member.nollaIn.imageUrl} alt="Group logo" />
                      </figure>
                    {:else}
                      <CommitteeIcon
                        class="size-7"
                        committee={{
                          nameSv: "nollu",
                          darkImageUrl:
                            "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/committee_logos/nollu/SVG/symbol/dark.svg",
                          lightImageUrl:
                            "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/committee_logos/nollu/SVG/symbol/light.svg",
                          monoImageUrl:
                            "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/committee_logos/nollu/SVG/symbol/bw.svg",
                        }}
                      />
                    {/if}
                  </a>
                  <div class="flex flex-col justify-center">
                    <h5>
                      Nolla i {member.nollaIn.name}
                    </h5>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
      {#if medals.length > 0}
        <div class="flex flex-col items-center">
          <h2 class="my-4 self-center">{m.medals()}</h2>
          {#each medals as medal (medal.medal)}
            <div class="inline-flex flex-col items-center gap-2">
              <CommitteeIcon class="size-32" committee={null} />
              <div class="flex flex-col items-center justify-center">
                <a href={getMedalLink(medal.after)}
                  ><h6 class="hover:text-muted-foreground transition-all">
                    {medal.medal}
                  </h6></a
                >
                <p class="text-muted-foreground mt-0">
                  {m.medals_since() + " " + toString(medal.after)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{/snippet}

{#snippet desktop()}
  <aside class="flex w-5/12 flex-col gap-4 lg:w-3/12">
    <div class="flex flex-col items-center gap-4">
      <Avatar.Root class="relative size-44">
        <Avatar.Image src={member.picturePath} alt="Member image" />
        <Avatar.Fallback
          >{member.firstName && member.lastName
            ? member.firstName?.charAt(0) + member.lastName?.charAt(0)
            : "NN"}</Avatar.Fallback
        >
      </Avatar.Root>
      <span class="flex flex-row items-center gap-0"
        ><code>{member.studentId}</code><Button
          onclick={() => navigator.clipboard.writeText(member.studentId ?? "")}
          variant="ghost"
          size="icon-sm"><Copy /></Button
        ></span
      >
    </div>
    <div class="flex flex-col">
      <h6>Bio</h6>
      <MemberBio bio={member.bio} />
    </div>
    <div class="inline-flex flex-col items-start gap-1">
      <h6>{m.medals()}</h6>
      {#if medals.length > 0}
        <section class="inline-flex flex-col gap-2">
          {#each medals as medal (medal.medal)}
            <div
              class="inline-flex flex-row items-center gap-4 rounded-md border-[1px] p-3 pr-4"
            >
              <CommitteeIcon class="size-8" committee={null} />
              <div class="flex flex-col justify-center">
                <a href={getMedalLink(medal.after)}
                  ><h6 class="hover:text-muted-foreground transition-all">
                    {medal.medal}
                  </h6></a
                >
                <p class="text-muted-foreground mt-0">
                  {m.medals_since() + " " + toString(medal.after)}
                </p>
              </div>
            </div>
          {/each}
        </section>
      {/if}
    </div>
  </aside>

  <main class="md:w-9/12">
    <!-- <h4>Riddare</h4> -->
    <div class="flex flex-row items-end gap-1 pt-7">
      <h1>{member.firstName} {member.lastName}</h1>
      <Badge
        variant={programmeColors[member.classProgramme ?? "?"] ?? "rosa"}
        class="mb-2 ml-3"
        size="lg"
        >{(member.classProgramme ?? "?") +
          (member.classYear?.toString().slice(-2) ?? "??")}</Badge
      >
      <Dialog.Root>
        <div class="ml-auto self-center">
          <Dialog.Trigger
            class={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "ml-auto self-center",
            )}><Pen /> {m.member_edit_profile()}</Dialog.Trigger
          >
          <Dialog.Content
            class="z-51 max-h-[90vh] overflow-y-scroll sm:max-w-[425px]"
          >
            <Dialog.Header>
              <Dialog.Title>{m.member_edit_profile()}</Dialog.Title>
            </Dialog.Header>
            <MemberForm {data} dialog />
          </Dialog.Content>
        </div>
      </Dialog.Root>
    </div>
    <h4 class="mb-12">{member.nickname ? "“" + member.nickname + "”" : ""}</h4>

    <Tabs.Root value="positions">
      <Tabs.List>
        <Tabs.Trigger value="positions">{m.positions()}</Tabs.Trigger>
        <Tabs.Trigger disabled value="pictures">{m.pictures()}</Tabs.Trigger>
        <Tabs.Trigger value="articles">{m.news()}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="positions">
        {#if Object.keys(mandatesByYear).length > 0}
          {#each Object.entries(mandatesByYear)
            .toSorted()
            .toReversed() as [year, mandates] (year)}
            <div
              class="animate-in slide-in-from-bottom-[1rem] duration-400"
              style="animation-delay: {(new Date().getFullYear() -
                parseInt(year)) *
                25 +
                50}ms"
            >
              <h6 class="my-2">{year}</h6>
              <!-- This if-statement is just to make TypeScript happy. -->
              <div class="inline-grid grid-cols-1 gap-4 lg:grid-cols-2">
                {#if mandates}
                  {#each mandates as mandate (mandate.id)}
                    <PositionCard {mandate} />
                  {/each}
                {/if}
                {#if member.nollaIn?.year.toString() === year}
                  <div
                    class="inline-flex w-84 flex-row items-center gap-4 rounded-md border-[1px] p-3"
                  >
                    <a href="/committees/nollu?year={member.nollaIn.year}">
                      {#if member.nollaIn.imageUrl}
                        <figure class="size-7 overflow-hidden rounded-sm">
                          <img src={member.nollaIn.imageUrl} alt="Group logo" />
                        </figure>
                      {:else}
                        <CommitteeIcon
                          class="size-8"
                          committee={{
                            nameSv: "nollu",
                            darkImageUrl:
                              "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/committee_logos/nollu/SVG/symbol/dark.svg",
                            lightImageUrl:
                              "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/committee_logos/nollu/SVG/symbol/light.svg",
                            monoImageUrl:
                              "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/committee_logos/nollu/SVG/symbol/bw.svg",
                          }}
                        />
                      {/if}
                    </a>
                    <div class="flex flex-col justify-center">
                      <h6>
                        Nolla i {member.nollaIn.name}
                      </h6>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </Tabs.Content>
      <Tabs.Content value="articles">
        <div class="flex flex-col gap-2">
          {#each data.publishedArticles as article, index (article.id)}
            <a href="/news/{article.slug}">
              <div
                class="hover:prose-h5:text-muted-foreground hover:prose-p:text-muted-foreground bg-background hover:bg-muted-background animate-in slide-in-from-bottom-[0.5rem] flex w-full flex-col rounded-md border p-4 transition-all duration-500"
                style="animation-delay: {index * 30}ms"
              >
                <div class="flex flex-row justify-between">
                  <h5>{article.header}</h5>
                  <span class="text-muted-foreground"
                    >{dayjs(article.createdAt).format("YYYY-MM-DD")}</span
                  >
                </div>
                <p class="line-clamp-2 overflow-ellipsis">{article.body}</p>
              </div>
            </a>
          {/each}
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </main>
{/snippet}
