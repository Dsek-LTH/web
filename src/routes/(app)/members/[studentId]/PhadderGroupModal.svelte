<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import FormSelect from "$lib/components/forms/FormSelect.svelte";
  import type { Member, PhadderGroup } from "@prisma/client";
  import { page } from "$app/state";
  import Modal from "$lib/components/Modal.svelte";
  import type { PhadderGroupSchema } from "./+page.server";
  import { marked } from "marked";

  let {
    isEditing = $bindable(),
    phadderGroups,
    data,
    viewedMember,
  }: {
    isEditing: boolean;
    phadderGroups: PhadderGroup[];
    data: SuperValidated<PhadderGroupSchema>;
    viewedMember: Member;
  } = $props();

  const superform = superForm<PhadderGroupSchema>(data, {
    onResult: (event) => {
      if (event.result.type === "success") {
        isEditing = false;
      }
    },
  });
  const { form, enhance } = superform;

  let skipped = false;
  const member = $derived(page.data.member);
  const noPhadderGroup = $derived(
    !!member && member.nollningGroupId == null && !skipped,
  );
</script>

{#if member?.id === viewedMember?.id}
  <Modal show={noPhadderGroup}>
    <h3 class="text-lg font-bold">{m.members_phadder_group_modal_title()}</h3>
    <p class="text-sm font-light">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
      {@html marked(m.members_phadder_group_modal_subtitle())}
    </p>

    <form
      id="edit-phadder-group"
      method="POST"
      action="?/updatePhadderGroup"
      use:enhance
      class="form-control max-w-full gap-2"
    >
      <FormSelect
        {superform}
        label={m.onboarding_phadderGroup()}
        field="nollningGroupId"
        options={[
          {
            value: null,
            label: "-",
          },
          ...phadderGroups
            .filter(
              (group) =>
                group.year === ($form.classYear ?? new Date().getFullYear),
            )
            .map((group) => ({
              value: group.id,
              label: group.name,
            })),
        ]}
      />
      <div class="mt-4 flex flex-wrap gap-2 *:flex-1">
        <button type="submit" class="btn btn-primary">
          {m.members_save()}
        </button>
        <button type="submit" class="btn" onclick={() => (skipped = true)}>
          {m.phadder_group_modal_skip()}
        </button>
      </div>
    </form>
  </Modal>
{/if}
