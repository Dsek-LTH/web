<script lang="ts">
  import type { PageData } from "./$types";
  import { page } from "$app/stores";
  import { getFullName } from "$lib/utils/client/member";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";
  import SEO from "$lib/seo/SEO.svelte";

  import "./home.css";
  import { markdownToTxt } from "markdown-to-txt";
  import dayjs from "dayjs";
  export let data: PageData;
</script>

<SetPageTitle />
<SEO
  data={{
    type: "website",
    props: {
      title: "D-sektionen",
      description: m.landing_intro(),
    },
  }}
/>
<div class="homepage pb-20">
  <div class="m-2 bg-primary p-1 text-center text-2xl font-bold text-white">
    Datatekniksektionen
  </div>
  <div id="home" class="flex flex-col gap-4 md:flex-row">
    <div class="float-left m-2 w-64 border-2 border-primary *:ml-1">
      <ul>
        <li><a href="/home"><b>Förstasidan</b></a></li>
        <li><a href="/events">Kalender</a></li>
        <li><a href="/news">Nyheter</a></li>
        <li><a href="/shop/tickets">Biljetter</a></li>
        <li><a href="/documents/governing">{m.documents_governing()}</a></li>
        <li><a href="/documents">{m.documents_meetingDocuments()}</a></li>
        <li>
          <a href="/documents/requirements"
            >{m.documents_requirementProfiles()}</a
          >
        </li>
        <li><hr class="my-1 mr-1 h-[2px] bg-primary" /></li>
        <li><a href="/board">{m.theBoard()}</a></li>
        <li><a href="/committees">{m.committees()}</a></li>
        <li><a href="/elections">{m.openElections()}</a></li>
        <li><a href="/bookings">{m.bookings()}</a></li>
        <li><a href="/expenses">{m.expenses()}</a></li>
        <li><a href="/songbook">{m.songBook()}</a></li>
        <li><a href="/medals">{m.medals()}</a></li>
        <li><a href="/gallery">{m.gallery()}</a></li>
      </ul>
      <hr class="my-1 mr-1 h-[2px] bg-primary" />
      {#if $page.data.member}
        <p>Inloggad som {getFullName($page.data.member)}</p>
        <ul>
          <li><a href="/members/me">{m.navbar_userMenu_profile()}</a></li>
          <li><a href="/settings">{m.navbar_userMenu_settings()}</a></li>
        </ul>
      {/if}
    </div>

    <div class="mx-4 md:mx-0 md:w-[500px]">
      <h1 class="border-b-2 border-primary text-lg font-bold text-primary">
        Välkommen jämte D-sektionen...2004!
      </h1>
      <div class="flex flex-row justify-between">
        {#if $page.data.member}
          <div>
            <p>
              Hej {getFullName($page.data.member)}! Idag är det första april!
            </p>
            <br />
            <p>Ungefär så här såg hemsidan ut 1 april 2004...</p>
            <br />
            <p>Oroa dig inte, den borde vara som vanligt imorgon igen!</p>
          </div>
        {/if}
        <img
          src="https://i.imgur.com/XVb6nfS.png"
          alt="panter"
          class="m-4 h-32"
        />
      </div>

      <h1 class="border-b-2 border-primary text-lg font-bold text-primary">
        Senaste nytt
      </h1>
      {#each data.news as article}
        <div class="mb-10">
          <div class="flex flex-col">
            <a href="/news/{article.slug}" class="font-bold">{article.header}</a
            >
            <p><i>infört {article.createdAt.toString().slice(0, 24)}</i></p>
          </div>
          <p class="line-clamp-3 text-ellipsis">
            {markdownToTxt(article.body, { pedantic: true })}
          </p>

          <span class="text-xs text-black">
            <a href="/members/{article.author.member.studentId}"
              >{article.author.member.firstName}</a
            >{article.author.mandate
              ? `, ${
                  article.author.mandate?.position.name
                } (${article.author.mandate?.position.email})`
              : ""}
          </span>
        </div>
      {/each}

      <h1 class="border-b-2 border-primary text-lg font-bold text-primary">
        Info från DWWW
      </h1>
      <p>
        DWWW kan med gläjde informera om att arbetet med nya hemsidan går
        framåt, och vi tror att den kommer vara klar om ett halvår.™
      </p>
    </div>

    <div class="mx-4 md:mx-0 md:w-[500px]">
      <h1 class="border-b-2 border-primary text-lg font-bold text-primary">
        Nytt under den senaste veckan!
      </h1>

      {#each data.files.next.slice(0, 4) as file}
        <li class="inline-block max-w-full">
          <a href={file.thumbnailUrl}>
            <span class="i-mdi-document size-6 text-secondary"></span>
            <span class="overflow-x-hidden text-ellipsis whitespace-nowrap">
              {file.name}
            </span>
          </a>
        </li>
      {/each}

      <h1 class="border-b-2 border-primary text-lg font-bold text-primary">
        Nästa kalenderhändelse
      </h1>

      {#each data.events as event}
        <div class="flex flex-col">
          <span class="text-black"
            ><a class="font-bold" href="/events/{event.slug}">{event.title}</a>, {dayjs(
              event.startDatetime,
            ).format("YYYY-MM-DD HH:MM")}</span
          >
        </div>
      {/each}

      <h1 class="border-b-2 border-primary text-lg font-bold text-primary">
        Utskott
      </h1>
      <ul>
        {#if data.committees}
          {#each data.committees as committee}
            <li>
              <a href="/committees/{committee.shortName}">{committee.name}</a>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>
</div>
