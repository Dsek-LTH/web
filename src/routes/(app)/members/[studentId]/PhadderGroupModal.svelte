<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { Member, PhadderGroup } from "@prisma/client";
  import { page } from "$app/state";
  import type { PhadderGroupSchema } from "./+page.server";
  import { marked } from "marked";

  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import Users from "@lucide/svelte/icons/users";
  import { buttonVariants } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";

  let {
    isEditing = $bindable(),
    phadderGroups,
    data,
    viewedMember,
    showModal,
  }: {
    isEditing: boolean;
    phadderGroups: PhadderGroup[];
    data: SuperValidated<PhadderGroupSchema>;
    viewedMember: Member;
    showModal: boolean;
  } = $props();

  const superform = $derived(
    superForm<PhadderGroupSchema>(data, {
      onResult: (event) => {
        console.log(event.result.type);
        if (event.result.type === "success") {
          isEditing = false;
        }
      },
    }),
  );
  const { form, enhance } = $derived(superform);

  const member = $derived(page.data.member);
</script>

<Dialog.Root open={member?.id === viewedMember?.id && showModal}>
  <Dialog.Trigger></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {m.members_phadder_group_modal_title()}
      </Dialog.Title>
      <Dialog.Description>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
        {@html marked(m.members_phadder_group_modal_subtitle())}
      </Dialog.Description>
    </Dialog.Header>

    <form
      id="edit-phadder-group"
      method="POST"
      action="?/updatePhadderGroup"
      use:enhance
      class="gap-2"
    >
      <div class="flex w-full flex-col gap-1.5 px-4">
        <Label for="nollningGroupId">{m.onboarding_phadderGroup()}</Label>
        <Select.Root
          type="single"
          bind:value={$form.nollningGroupId as string | undefined}
          name="nollningGroupId"
        >
          <Select.Trigger class="w-full"
            ><Users />{$form.nollningGroupId
              ? phadderGroups.find((g) => g.id == $form.nollningGroupId)!.name
              : ""}</Select.Trigger
          >
          <Select.Content>
            {#each phadderGroups.filter((g) => g.year == member?.classYear) as group (group.id)}
              <Select.Item value={group.id}>{group.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <Dialog.Footer class="mt-4 px-4 py-2">
        <Dialog.Close
          type="submit"
          class={cn(buttonVariants({ variant: "outline" }), "mr-auto")}
          name="skipAction"
          value="never"
        >
          {m.members_phadder_group_modal_never()}
        </Dialog.Close>
        <Dialog.Close
          type="submit"
          class={buttonVariants({ variant: "outline" })}
          name="skipAction"
          value="skip"
        >
          {m.members_phadder_group_modal_skip()}
        </Dialog.Close>

        <Dialog.Close class={buttonVariants({ variant: "rosa" })} type="submit">
          {m.members_save()}
        </Dialog.Close>
      </Dialog.Footer>
    </form></Dialog.Content
  >
</Dialog.Root>
