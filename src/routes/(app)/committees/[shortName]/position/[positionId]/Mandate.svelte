<script lang="ts">
  import MemberAvatar from "$lib/components/member/MemberAvatar.svelte";
  import UpdateMandateForm from "./UpdateMandateForm.svelte";
  import DeleteMandateForm from "./DeleteMandateForm.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import type { PageData } from "./$types";
  import Pen from "@lucide/svelte/icons/pen";
  import X from "@lucide/svelte/icons/x";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import ProgrammeBadge from "$lib/components/member/ProgrammeBadge.svelte";

  let { data, mandate }: { data: PageData; mandate: PageData["mandates"][0] } =
    $props();

  let isEditing = $state(false);

  let startDate = $derived(mandate.startDate.toLocaleDateString("sv-SE"));
  let endDate = $derived(mandate.endDate.toLocaleDateString("sv-SE"));
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    <div class="relative flex items-center gap-2 before:whitespace-pre">
      <a
        href="/members/{mandate.member.studentId}"
        class="flex flex-1 place-items-center gap-2 overflow-hidden normal-case"
      >
        <MemberAvatar member={mandate.member} />
        <span
          class="flex-1 overflow-hidden text-left font-medium text-ellipsis whitespace-nowrap"
        >
          {getFullName(mandate.member)}
        </span>
      </a>
      <ProgrammeBadge member={mandate.member} />

      <!-- Edit button -->
      {#if isAuthorized(apiNames.MANDATE.UPDATE, data.user) || isAuthorized(apiNames.MANDATE.DELETE, data.user)}
        <div class="aspect-square h-2/3">
          <span
            class=" {isEditing
              ? 'opacity-80'
              : 'opacity-20'} transition-opacity hover:opacity-100"
            >{#if isEditing}<X
                onclick={() => (isEditing = !isEditing)}
                class="h-5"
              />{:else}<Pen
                onclick={() => (isEditing = !isEditing)}
                class="h-5"
              />{/if}</span
          >
        </div>
      {/if}

      <!-- Edit modal -->
      {#if isEditing}<div
          class="bg-muted-background absolute top-full -left-15 z-10 flex flex-col items-center rounded-md border-[1px] p-4 sm:right-0 sm:left-0 sm:w-fit"
        >
          {#await data.updateMandateForm then form}
            <UpdateMandateForm
              onsubmit={() => {
                isEditing = false;
              }}
              data={((f) => {
                // This works well enough
                f.data.startDate = mandate.startDate;
                f.data.endDate = mandate.endDate;
                f.data.mandateId = mandate.id;
                return f;
              })(form)}
            />
          {/await}
          {#if isAuthorized(apiNames.MANDATE.DELETE, data.user)}
            {#await data.deleteMandateForm then form}
              <DeleteMandateForm
                mandateId={mandate.id}
                data={form}
                onsubmit={() => {
                  isEditing = false;
                }}
              />
            {/await}
          {/if}
        </div>{/if}
    </div>
  </Tooltip.Trigger>
  <Tooltip.Content class={isEditing ? "hidden" : ""}>
    {getFullName(mandate.member) + `\n${startDate} - ${endDate}`}
  </Tooltip.Content>
</Tooltip.Root>
