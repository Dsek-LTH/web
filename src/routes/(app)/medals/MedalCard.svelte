<script lang="ts">
  import ScrollIndicatedBox from "$lib/components/ScrollIndicatedBox.svelte";
  import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import type { Member } from "@prisma/client";

  export let medal: string;
  export let recipients: Member[];
  let mandatesBox: HTMLDivElement; // Function to check whether the element is overflowing
</script>

<article class="card bg-base-200 shadow-xl transition-all">
  <div class="card-body">
    <h2 class="card-title">
      {medal}
      {#if recipients.length > 1}
        ({recipients.length} st)
      {/if}
    </h2>
    <!-- <p class="flex-grow-0">{position.description ?? ""}</p> -->
    <ScrollIndicatedBox element={mandatesBox}>
      <div class="max-h-80 overflow-y-auto" bind:this={mandatesBox}>
        <ul class="menu menu-vertical p-0">
          {#each recipients as recipient (recipient.id)}
            <li>
              <a href="/members/{recipient.studentId}">
                <div class="flex flex-row items-center gap-2">
                  <MemberAvatar member={recipient} />
                  <div>
                    <h3 class="font-medium">
                      {getFullName(recipient)}
                    </h3>
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
