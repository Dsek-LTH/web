<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<PageHeader title="Styrelsen" />
<!-- TODO: make this editable by board members with Markdown page -->
<p>
  Styrelsen ansvarar för den dagliga verksamheten på sektionen. Till styrelsen
  kan du alltid vända dig om du har frågor, funderingar eller åsikter om
  sektionen och dess verksamhet. Styrelsen sammanträder på styrelsemöten varje
  vecka och är öppna för alla medlemmar.
</p>
<br />
<p>
  Styrelsen kan nås på <a class="text-primary" href="mailto:styrelsen@dsek.se"
    >styrelsen@dsek.se</a
  >
</p>
<br />
<div
  class="grid grid-cols-1 items-stretch justify-items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3"
>
  {#each data.boardPositions as member (member.position.id)}
    <div class="card bg-base-200 transition-all">
      {#if member.studentId && member.firstName && member.nickname && member.lastName}
        <a
          href="/members/{member.studentId}"
          class="group card bg-base-200 shadow-xl transition-all hover:bg-base-200/80"
        >
          <figure class="mt-4 transition-transform group-hover:scale-90">
            <MemberAvatar {member} class="h-24 w-24 rounded-full" />
          </figure>
          <div class="card-body px-0 text-center">
            <h2 class="card-title mx-auto">
              {getFullName(member)}
            </h2>
            <div class="flex flex-col gap-1 px-2 text-base-content/90">
              <a
                class="text-xl hover:underline"
                href="/positions/{member.position.id}">{member.position.name}</a
              >
              <a
                class="text-sm hover:underline"
                href="mailto:{member.position.email}"
              >
                <span class="i-mdi-email m-1 h-max text-base-content"
                  >{member.position.email}</span
                >{member.position.email}</a
              >
            </div>
          </div>
        </a>
      {:else}
        <!-- position is vacant -->
        <div
          class="group card bg-base-200 shadow-xl transition-all hover:bg-base-200/80"
        >
          <figure class="mt-4 transition-transform group-hover:scale-90">
            <!-- MemberAvatar renders well even with null-values -->
            <MemberAvatar {member} class="h-24 w-24 rounded-full" />
          </figure>
          <div class="card-body px-0 text-center">
            <h2 class="card-title mx-auto">V.A. Kant</h2>
            <div class="flex flex-col gap-1 px-2 text-base-content/90">
              <a
                class="text-xl hover:underline"
                href="/positions/{member.position.id}">{member.position.name}</a
              >
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>
