<script lang="ts">
  import type { CommitteeLoadData } from "./committee.server";

  import { buttonVariants } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Dialog from "$lib/components/ui/dialog";
  import Label from "$lib/components/ui/label/label.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Checkbox } from "$lib/components/ui/checkbox";

  import * as m from "$paraglide/messages";

  let { data }: { data: CommitteeLoadData } = $props();

  let committee = $derived(data.committee);

  const { form, errors, enhance } = $derived(
    superForm(data.form, { id: "details" }),
  );
</script>

<form
  action="/committees/{committee.shortName}?/updateCommitteeDetails"
  method="POST"
  use:enhance
>
  <Dialog.Header class="mb-2">
    <Dialog.Title>{m.committees_edit_committee()}</Dialog.Title>
  </Dialog.Header>
  <div class="flex flex-col gap-2 px-4">
    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_name()}</Label>
      <Input
        name="nameSv"
        aria-invalid={$errors.nameSv ? true : false}
        aria-errormessage={$errors.nameSv?.at(0)}
        bind:value={$form.nameSv}
        type="text"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_name_en()}</Label>
      <Input
        name="nameEn"
        aria-invalid={$errors.nameEn ? true : false}
        aria-errormessage={$errors.nameEn?.at(0)}
        bind:value={$form.nameEn}
        type="text"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_description()}</Label>
      <Textarea
        name="descriptionSv"
        aria-invalid={$errors.descriptionSv ? true : false}
        aria-errormessage={$errors.descriptionSv?.at(0)}
        bind:value={$form.descriptionSv}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_description_en()}</Label>
      <Textarea
        name="descriptionEn"
        aria-invalid={$errors.descriptionEn ? true : false}
        aria-errormessage={$errors.descriptionEn?.at(0)}
        bind:value={$form.descriptionEn}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_committeeImage_light()}</Label>
      <Input
        name="lightImageUrl"
        aria-invalid={$errors.lightImageUrl ? true : false}
        aria-errormessage={$errors.lightImageUrl?.at(0)}
        bind:value={$form.lightImageUrl}
        type="text"
        placeholder="https://raw.githubusercontent.com..."
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_committeeImage_dark()}</Label>
      <Input
        name="darkImageUrl"
        aria-invalid={$errors.darkImageUrl ? true : false}
        aria-errormessage={$errors.darkImageUrl?.at(0)}
        bind:value={$form.darkImageUrl}
        type="text"
        placeholder="https://raw.githubusercontent.com..."
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_committeeImage_mono()}</Label>
      <Input
        name="monoImageUrl"
        aria-invalid={$errors.monoImageUrl ? true : false}
        aria-errormessage={$errors.monoImageUrl?.at(0)}
        bind:value={$form.monoImageUrl}
        type="text"
        placeholder="https://raw.githubusercontent.com..."
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_committeeImage_symbol()}</Label>
      <Input
        name="symbolUrl"
        aria-invalid={$errors.symbolUrl ? true : false}
        aria-errormessage={$errors.symbolUrl?.at(0)}
        bind:value={$form.symbolUrl}
        type="text"
        placeholder="https://raw.githubusercontent.com..."
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.committees_card_image()}</Label>
      <Input
        name="previewUrl"
        aria-invalid={$errors.previewUrl ? true : false}
        aria-errormessage={$errors.previewUrl?.at(0)}
        bind:value={$form.previewUrl}
        type="text"
        placeholder="https://files.dsek.se..."
      />
    </div>

    <div class="space-between flex flex-row gap-2">
      <div class="flex w-full flex-col gap-1.5">
        <Label>{m.committees_banner_image()}</Label>
        <Input
          name="bannerUrl"
          aria-invalid={$errors.bannerUrl ? true : false}
          aria-errormessage={$errors.bannerUrl?.at(0)}
          bind:value={$form.bannerUrl}
          type="text"
          placeholder="https://files.dsek.se..."
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label>{m.committees_invert_text()}</Label>
        <Checkbox
          name="isBannerTextLight"
          bind:checked={$form.isBannerTextLight}
          class="size-6"
        />
      </div>
    </div>
  </div>
  <Dialog.Footer class="mt-2">
    <Dialog.Close class={buttonVariants({ variant: "outline" })}
      >{m.cancel()}</Dialog.Close
    >
    <Dialog.Close class={buttonVariants({ variant: "rosa" })} type="submit"
      >{m.save()}</Dialog.Close
    >
  </Dialog.Footer>
</form>
