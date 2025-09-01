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
  import type { Cookies } from "@sveltejs/kit";

  let {
    isEditing = $bindable(),
    phadderGroups,
    data,
    viewedMember,
    cookies,
  }: {
    isEditing: boolean;
    phadderGroups: PhadderGroup[];
    data: SuperValidated<PhadderGroupSchema>;
    viewedMember: Member;
    cookies: Cookies;
  } = $props();

  const superform = superForm<PhadderGroupSchema>(data, {
    onResult: (event) => {
      if (event.result.type === "success") {
        isEditing = false;
      }
    },
  });
  const { form, enhance } = superform;

  let skipped: Boolean = cookies.get("phadder_group_modal_skipped") == "1";
  let never: Boolean = cookies.get("phadder_group_modal_never") == "1";
  const member = $derived(page.data.member);
  const noPhadderGroup = $derived(
    !!member && member.nollningGroupId == null && !skipped,
  );
</script>

{#if member?.id === viewedMember?.id && !skipped && !never}
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
        <button
          type="submit"
          class="btn"
          onclick={() =>
            cookies.set("phadder_group_modal_skipped", "1", {
              path: "/",
              maxAge: 12 * 60 * 60,
            })}
        >
          {m.members_phadder_group_modal_skip()}
        </button>
        <button
          type="submit"
          class="btn"
          onclick={() =>
            cookies.set("phadder_group_modal_never", "1", { path: "/" })}
        >
          {m.members_phadder_group_modal_never()}
        </button>
      </div>
    </form>
  </Modal>
{/if}
