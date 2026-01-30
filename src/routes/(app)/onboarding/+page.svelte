<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import { programmes } from "$lib/utils/programmes";
  import * as m from "$paraglide/messages";
  import { onMount } from "svelte";
  import type { PageData } from "./$types";
  import type { UpdateSchema } from "./+page.server";
  import { getFileUrl } from "$lib/files/client";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import Users from "@lucide/svelte/icons/users";
  import Mail from "@lucide/svelte/icons/mail";
  import Save from "@lucide/svelte/icons/save";
  import Book from "@lucide/svelte/icons/book";
  import Calendar from "@lucide/svelte/icons/calendar";
  import UtensilsCrossed from "@lucide/svelte/icons/utensils-crossed";
  import { Button } from "$lib/components/ui/button";
  import { getLocale, setLocale } from "$paraglide/runtime";
  import Languages from "@lucide/svelte/icons/languages";
  import { setLanguage } from "$lib/utils/languages.remote";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let { data }: { data: PageData } = $props();
  const { form, errors, constraints, enhance } = superForm<UpdateSchema>(
    data.form,
  );
  onMount(() => {
    if (
      data.member &&
      data.member.firstName &&
      data.member.lastName &&
      data.member.classProgramme &&
      data.member.classYear
    ) {
      goto(resolve("/"));
    }
  });

  let phaddergroups = $derived(
    data.phadderGroups
      .filter(
        (group) => group.year === ($form.classYear ?? new Date().getFullYear),
      )
      .map((group) => group),
  );
</script>

<SetPageTitle title={m.onboarding()} />
<div
  class="hero-image min-h-screen bg-cover bg-center"
  style:--url="url({getFileUrl('minio/files/public/photos/stock2.jpg')})"
>
  <div class="min-h-screen bg-cover py-16 md:bg-transparent">
    <div
      class="bg-background w-full rounded-xl p-4 py-16 md:mx-32 md:max-w-xl md:p-10"
    >
      <div class="text-5xl font-bold">{m.onboarding_welcome()}</div>
      <div class="text-lg">{m.onboarding_fillInInfoBelow()}</div>

      <form
        id="edit-member"
        method="POST"
        action="?/update"
        use:enhance
        class="mt-4 flex flex-col gap-2"
      >
        <div class="flex flex-row gap-2">
          <div class="grid w-full items-center gap-1.5">
            <Label for="firstName">{m.onboarding_firstName()}</Label>
            <Input
              name="firstName"
              required
              bind:value={$form.firstName}
              {...$constraints.firstName}
              aria-errormessage={$errors.firstName?.at(0)}
            />
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="lastName">{m.onboarding_lastName()}</Label>
            <Input
              name="lastName"
              required
              bind:value={$form.lastName}
              {...$constraints.lastName}
              aria-errormessage={$errors.lastName?.at(0)}
            />
          </div>
        </div>
        <div class="grid w-full items-center gap-1.5">
          <Label for="email">{m.onboarding_email()}</Label>
          <Input
            name="email"
            required
            disabled
            readonly
            bind:value={$form.email}
            {...$constraints.email}
            aria-errormessage={$errors.email?.at(0)}><Mail /></Input
          >
        </div>
        <div class="grid w-full items-center gap-1.5">
          <Label for="pref">{m.onboarding_foodPreference()}</Label>
          <Input
            name="pref"
            bind:value={$form.foodPreference}
            {...$constraints.foodPreference}
            placeholder={m.onboarding_foodPreferencePlaceholder()}
            aria-errormessage={$errors.foodPreference?.at(0)}
            ><UtensilsCrossed /></Input
          >
        </div>
        <div class="flex flex-row gap-2">
          <div class="flex w-full flex-col gap-1.5">
            <Label for="classProgramme">{m.onboarding_programme()}</Label>
            <Select.Root
              type="single"
              bind:value={$form.classProgramme as string | undefined}
            >
              <Select.Trigger class="w-full"
                ><span class="flex flex-row items-center gap-1.5"
                  ><Book />{$form.classProgramme}</span
                ></Select.Trigger
              >
              <Select.Content>
                {#each programmes as programme (programme.id)}
                  <Select.Item value={programme.id}
                    >{programme.name}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid w-full items-center gap-1.5">
            <Label for="classYear">{m.onboarding_year()}</Label>
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

        <div class="flex w-1/2 gap-2 pt-6">
          <Button name="save" type="submit">
            <Save />
            {m.onboarding_save()}
          </Button>

          <Button
            aria-label="languages"
            onclick={async () => {
              const lang = getLocale() === "en" ? "sv" : "en";
              await setLanguage(lang);
              setLocale(lang);
            }}
            size="icon-lg"
            variant="ghost"
            class="p-1.5"><Languages /></Button
          >
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .hero-image {
    background-image: var(--url);
  }
</style>
