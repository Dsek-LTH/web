<script lang="ts">
  import type { Member } from "@prisma/client";

  export let recipients: Array<{ medal: string; recipients: Member[] }> = [];
</script>

<div>
  {#each recipients as group}
    <div class="collapse collapse-arrow mb-2 bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title text-xl font-medium">{group.medal}</div>
      <div class="collapse-content">
        {#each group.recipients as recipient}
          <p>
            {recipient.firstName}
            {recipient.lastName} ({recipient.studentId})
          </p>
        {/each}
      </div>
    </div>
  {/each}
</div>
