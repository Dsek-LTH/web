<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import Pen from "@lucide/svelte/icons/pen";
  import Languages from "@lucide/svelte/icons/languages";
  import Book from "@lucide/svelte/icons/book";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Users from "@lucide/svelte/icons/users";
  import * as m from "$paraglide/messages";
  import { superForm } from "$lib/utils/client/superForms";
  import type { UpdateSchema } from "./+page.server";
  import Button, {
    buttonVariants,
  } from "$lib/components/ui/button/button.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import { languages } from "$lib/utils/languages";
  import * as Select from "$lib/components/ui/select";
  import { programmes } from "$lib/utils/programmes";

  import * as Dialog from "$lib/components/ui/dialog";
  import type { PageData } from "./$types";
  import type { PageData as EditPageData } from "./edit/$types";
  import PictureSelector from "./PictureSelector.svelte";
  import { Textarea } from "$lib/components/ui/textarea";

  let { data, dialog }: { data: PageData | EditPageData; dialog: boolean } =
    $props();

  let superform = $derived(superForm<UpdateSchema>(data.form));

  const { form, constraints, errors, delayed } = $derived(superform);

  const langNames: Record<string, string> = {
    sv: m.language_swedish(),
    en: m.language_english(),
  };

  let phaddergroups = $derived(
    data.phadderGroups
      .filter(
        (group) => group.year === ($form.classYear ?? new Date().getFullYear),
      )
      .map((group) => group),
  );
</script>

<main class="overflow-y-scoll flex flex-col items-center gap-2">
  <PictureSelector {data} />
  <form
    id="member"
    method="POST"
    enctype="multipart/form-data"
    action="?/update"
  >
    <!-- removed use:enhance as a temporary fix for picture deletion-->
    <section
      class="mt-2 flex flex-col items-center gap-2 {dialog ? 'px-4' : ''}"
    >
      <div class="flex flex-row gap-2">
        <div class="flex w-full flex-col gap-1.5">
          <Label for="firstName">{m.members_firstName()}</Label><Input
            bind:value={$form.firstName}
            type="text"
            id="firstName"
            name="firstName"
            placeholder="Råsa"
            aria-invalid={$errors.firstName ? true : false}
            aria-errormessage={$errors.firstName?.at(0)}><Pen /></Input
          >
        </div>
        <div class="flex w-full flex-col gap-1.5">
          <Label for="lastName">{m.members_lastName()}</Label><Input
            bind:value={$form.lastName}
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Pantern"
            aria-invalid={$errors.lastName ? true : false}
            aria-errormessage={$errors.lastName?.at(0)}><Pen /></Input
          >
        </div>
      </div>
      <div class="flex w-full flex-col gap-1.5">
        <Label for="nickname">{m.members_nickname()}</Label><Input
          bind:value={$form.nickname}
          type="text"
          id="nickname"
          name="nickname"
          placeholder=""
          aria-invalid={$errors.nickname ? true : false}
          aria-errormessage={$errors.nickname?.at(0)}><Pen /></Input
        >
      </div>
      <div class="flex w-full flex-col gap-1.5">
        <Label for="foodPreference">{m.members_foodPreference()}</Label><Input
          bind:value={$form.foodPreference}
          type="text"
          id="foodPreference"
          name="foodPreference"
          placeholder={m.onboarding_foodPreferencePlaceholder()}
          aria-invalid={$errors.foodPreference ? true : false}
          aria-errormessage={$errors.foodPreference?.at(0)}><Pen /></Input
        >
      </div>
      <div class="flex w-full flex-col gap-1.5">
        <Label for="language">{m.members_language()}</Label>
        <Select.Root
          type="single"
          name="language"
          bind:value={$form.language as string}
        >
          <Select.Trigger class="w-full"
            ><Languages />{$form.language
              ? langNames[$form.language]
              : ""}</Select.Trigger
          >
          <Select.Content>
            {#each languages as language (language.id)}
              <Select.Item value={language.id}>{language.name()}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex w-full flex-row gap-1">
        <div class="flex w-full flex-col gap-1.5">
          <Label for="classProgramme">{m.members_programme()}</Label>
          <Select.Root
            type="single"
            bind:value={$form.classProgramme as string | undefined}
            name="classProgramme"
          >
            <Select.Trigger class="w-full"
              ><span class="flex flex-row items-center gap-1.5"
                ><Book />{$form.classProgramme}</span
              ></Select.Trigger
            >
            <Select.Content>
              {#each programmes as programme (programme.id)}
                <Select.Item value={programme.id}>{programme.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid w-full items-center gap-1.5">
          <Label for="classYear">{m.members_year()}</Label>
          <Input
            name="classYear"
            required
            type="number"
            aria-invalid={$errors.classYear ? true : false}
            bind:value={$form.classYear}
            {...$constraints.classYear}
            aria-errormessage={$errors.classYear?.at(0)}
            onchange={() => {
              $form.nollningGroupId = null;
            }}><Calendar /></Input
          >
        </div>
      </div>
      <div class="flex w-full flex-col gap-1.5">
        <Label for="nollningGroupId">{m.onboarding_phadderGroup()}</Label>
        <Select.Root
          type="single"
          bind:value={$form.nollningGroupId as string | undefined}
          name="nollningGroupId"
        >
          <Select.Trigger class="w-full"
            ><Users />{$form.nollningGroupId
              ? phaddergroups.find((g) => g.id == $form.nollningGroupId)!.name
              : ""}</Select.Trigger
          >
          <Select.Content>
            {#each phaddergroups as group (group.id)}
              <Select.Item value={group.id}>{group.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="flex w-full flex-col gap-1.5">
        <Label for="bio">Bio</Label>
        <Textarea
          name="bio"
          bind:value={$form.bio}
          {...$constraints.bio}
          aria-invalid={$errors.bio ? true : false}
          aria-errormessage={$errors.bio?.at(0)}
        />
      </div>
    </section>
    {#if dialog}
      <Dialog.Footer class="mt-4 w-full px-4 py-2">
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: "outline" })}
          >{m.cancel()}</Dialog.Close
        >
        <Dialog.Close class={buttonVariants({ variant: "rosa" })} type="submit"
          >{m.save()}</Dialog.Close
        >
      </Dialog.Footer>
    {:else}
      <div class="mt-2 flex flex-row justify-end gap-2 px-4">
        <Button type="button" onclick={() => history.back()} variant="outline"
          >{m.cancel()}</Button
        >
        <Button type="submit"
          >{m.save()}{#if $delayed}<Spinner />{/if}</Button
        >
      </div>{/if}
  </form>
</main>
