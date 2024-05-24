<script lang="ts">
  import type { Member } from "@prisma/client";

  export let recipients: Member[] = [];
</script>

<div>
  <div class="collapse collapse-arrow mb-2 bg-base-200">
    <input type="checkbox" />
    <div class="collapse-title text-xl font-medium">Funktionärsmedalj</div>
    <div class="collapse-content">
      {#each recipients as recipient (recipient.studentId)}
        <p>
          {recipient.firstName}
          {recipient.lastName} ({recipient.studentId})
        </p>
      {/each}
    </div>
  </div>
  <div class="collapse collapse-arrow bg-base-200">
    <input type="checkbox" />
    <div class="collapse-title text-xl font-medium">Gammal && Äcklig</div>
    <div class="collapse-content">
      {#each recipients as recipient (recipient.studentId)}
        <p>
          {recipient.firstName}
          {recipient.lastName} ({recipient.studentId})
        </p>
      {/each}
    </div>
  </div>
</div>
