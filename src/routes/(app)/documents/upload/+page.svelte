<script lang="ts">
  import { type SuperForm, fileProxy } from "sveltekit-superforms/client";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import { typeToPath } from "./helpers";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { uploadSchema, type UploadSchema } from "./types";
  import Label from "$lib/components/ui/label/label.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Select from "$lib/components/ui/select";

  let { data }: { data: PageData } = $props();
  const { form, constraints, errors, enhance } = $derived(
    superForm(data.form, {
      onResult: (event) => {
        if (event.result.type === "success" && fileInput) {
          // On successful upload, set files to undefined and clear the filename
          // year and meeting is still kept as to easily upload more files for the same meeting
          fileInput.value = "";
        }
      },
      resetForm: false,
      validators: zod4Client(uploadSchema),
    }) as SuperForm<UploadSchema>,
  );
  const file = $derived(fileProxy(form, "file"));
  let fileInput: HTMLInputElement | null = $state(null);

  let pathInfo = $derived(typeToPath[$form.type]);
  let fileErrors = $derived($errors.file as string | string[] | undefined);

  let meetingPlaceholder = $derived.by(() => {
    switch ($form.type) {
      case "requirement":
        return "Øverphøs, Aktivitetsansvarig...";
      case "srd":
        return "SRD67, Möte 2";
      default:
        return "S18, HTM1, VTM-extra...";
    }
  });

  const documentTypes = [
    { value: "meeting", label: m.documents_boardGuildMeetings() },
    { value: "srd", label: m.documents_srdMeetings() },
    { value: "requirement", label: m.documents_requirementProfiles() },
  ];
</script>

<SetPageTitle title={m.documents_uploadDocument()} />

<div class="layout-container">
  <h2 class="mb-4">{m.documents_uploadDocument()}</h2>
  <form
    id="upload-file"
    class="flex flex-col items-stretch gap-4"
    method="POST"
    enctype="multipart/form-data"
    use:enhance
  >
    <div class="flex flex-row gap-4">
      <div class="flex flex-col gap-1.5">
        <Label>
          {m.documents_chooseDocumentType()}
        </Label>
        <Select.Root required type="single" name="type" bind:value={$form.type}>
          <Select.Trigger
            aria-invalid={$errors.type ? true : false}
            aria-errormessage={$errors.type?.at(0)}
            class="min-w-64"
          >
            {documentTypes.find((t) => t.value === $form.type)?.label ??
              m.documents_chooseDocumentType()}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>{m.documents_documentType()}</Select.Label>
              {#each documentTypes as type (type.value)}
                <Select.Item value={type.value} label={type.label}>
                  {type.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex w-full flex-col gap-1.5">
        <Label for="folder">
          {$form.type === "requirement"
            ? m.documents_writePositionName()
            : m.documents_writeMeetingName()}
        </Label>

        <Input
          id="folder"
          name="folder"
          bind:value={$form.folder}
          type="text"
          placeholder={meetingPlaceholder}
          aria-invalid={$errors.folder ? true : false}
          aria-errormessage={$errors.folder?.at(0)}
          {...$constraints.folder}
        />

        <p class="text-base-content/70 mt-0 text-sm italic">
          {m.documents_uploadInfo()}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="file">
        {m.documents_uploadFile()}
      </Label>
      <Input
        bind:ref={fileInput}
        id="file"
        type="file"
        name="file"
        aria-invalid={$errors.file || fileErrors ? true : false}
        aria-errormessage={fileErrors?.at(0) ?? $errors.file?.at(0)}
        bind:files={$file}
        oninput={(e) => {
          if (e.currentTarget.files) {
            $form.name =
              e.currentTarget.files
                ?.item(0)
                ?.name.replace(/_+/g, " ")
                .replace(/\..+$/, "") ?? "";
          }
        }}
        {...$constraints.file}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.documents_fileName()}</Label>
      <Input
        id="name"
        name="name"
        aria-invalid={$errors.name ? true : false}
        aria-errormessage={$errors.name?.at(0)}
        type="text"
        placeholder={m.documents_filePlaceholder()}
        bind:value={$form.name}
        {...$constraints.name}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="year">{m.documents_pickMeetingYear()}</Label>
      <Input
        id="year"
        name="year"
        type="number"
        aria-invalid={$errors.year ? true : false}
        aria-errormessage={$errors.year?.at(0)}
        bind:value={$form.year}
        {...$constraints.year}
      />
    </div>

    {#if $form.type && $form.folder && $form.name}
      <pre>{pathInfo.bucket}/{pathInfo.path(
          $form.year,
          $form.folder,
        )}/{$form.name}</pre>
    {/if}

    <div class="flex flex-row gap-2">
      <Button class="px-8" onclick={() => history.back()} variant="outline"
        >{m.cancel()}</Button
      >
      <Button type="submit" class="block grow" form="upload-file">
        {m.documents_upload()}
      </Button>
    </div>
  </form>
</div>
