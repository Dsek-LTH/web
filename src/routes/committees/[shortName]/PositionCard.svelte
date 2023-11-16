<script lang="ts">
  import { page } from "$app/stores";
  import ScrollIndicatedBox from "$lib/components/ScrollIndicatedBox.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Mandate, Member, Position } from "@prisma/client";

  export let position: Position;
  export let mandates: (Mandate & {
    member: Member;
  })[];
  let mandatesBox: HTMLDivElement; // Function to check whether the element is overflowing
</script>

<article class="card bg-base-200 shadow-xl transition-all">
  <div class="card-body">
    <h2 class="card-title">
      <a class="link-hover link-primary link" href="/positions/{position.id}">
        {position.name}
      </a>
      ({mandates.length} st)
    </h2>
    {#if position.email}
      <section class="-mt-2">
        <a class="link-hover link-primary link" href="mailto:{position.email}">
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
                      {getFullName($page.data.session?.user, mandate.member)}
                    </h3>
                    <h4 class="text-xs">
                      {mandate.startDate.toLocaleDateString(["sv"])} &gt;&gt; {mandate.endDate.toLocaleDateString(
                        ["sv"]
                      )}
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
