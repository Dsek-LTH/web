<script lang="ts">
  import ScrollIndicatedBox from "$lib/components/ScrollIndicatedBox.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Mandate, Member, Position } from "@prisma/client";
  import { page } from "$app/stores";
  import * as m from "$paraglide/messages";

  export let position: Position;
  export let mandates: Array<
    Mandate & {
      member: Member;
    }
  >;
  let mandatesBox: HTMLDivElement; // Function to check whether the element is overflowing
  $: year =
    parseInt($page.url.searchParams.get("year") ?? "") ||
    new Date().getFullYear();
</script>

<article class="card bg-base-200 shadow-xl transition-all">
  <div class="card-body">
    <h2 class="card-title">
      {#if position.boardMember}
        <a href="/board">
          <div class="tooltip" data-tip={m.committees_boardMember()}>
            <span class="i-mdi-account-tie" />
          </div>
        </a>
      {/if}
      <a class="link-hover link link-primary" href="/positions/{position.id}">
        {position.name}
      </a>
      {#if mandates.length > 1}
        ({mandates.length} st)
      {/if}
    </h2>
    {#if position.email}
      <section class="-mt-2">
        <a class="link-hover link link-primary" href="mailto:{position.email}">
          {position.email}
        </a>
      </section>
    {/if}
    <p class="flex-grow-0">{position.description ?? ""}</p>
    <ScrollIndicatedBox element={mandatesBox}>
      <div class="max-h-80 overflow-y-auto" bind:this={mandatesBox}>
        <ul class="menu menu-vertical p-0">
          {#each mandates as mandate (mandate.id)}
            <li>
              <a href="/members/{mandate.member.studentId}">
                <div class="flex flex-row items-center gap-2">
                  <MemberAvatar member={mandate.member} />
                  <div>
                    <h3 class="font-medium">
                      {getFullName(mandate.member)}
                    </h3>
                    <h4 class="text-xs">
                      {#if mandate.startDate.getFullYear() !== year}
                        <i>{mandate.startDate.toLocaleDateString(["sv"])}</i>
                      {:else}
                        {mandate.startDate.toLocaleDateString(["sv"])}
                      {/if}
                      &#8702;
                      {#if mandate.endDate.getFullYear() !== year}
                        <i>{mandate.endDate.toLocaleDateString(["sv"])}</i>
                      {:else}
                        {mandate.endDate.toLocaleDateString(["sv"])}
                      {/if}
                    </h4>
                  </div>
                </div>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </ScrollIndicatedBox>
  </div>
</article>
