<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import { enhance } from "$app/forms";
  import * as m from "$paraglide/messages.js";
  import Trash from "@lucide/svelte/icons/trash";
  import X from "@lucide/svelte/icons/x";
  import Plus from "@lucide/svelte/icons/plus";
  import type { PageData } from "./$types";
  import type { MemberSearchReturnAttributes } from "$lib/search/searchTypes";

  let { group }: { group: PageData["groups"][number] } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance: updateEnhance } = superForm(group.form, {
    id: group.id,
  });

  let newNolla = $state<(MemberSearchReturnAttributes & { id?: string }) | null>(
    null,
  );
  let newPhadder = $state<
    (MemberSearchReturnAttributes & { id?: string }) | null
  >(null);
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-3">
      {#if group.imageUrl}
        <img src={group.imageUrl} alt="" class="h-8 w-8 rounded object-contain" />
      {/if}
      {group.name}
    </CardTitle>
  </CardHeader>
  <CardContent class="flex flex-col gap-6">
    <form method="POST" action="?/update" use:updateEnhance class="flex flex-col gap-4">
      <input type="hidden" name="id" value={group.id} />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <Label for="name-{group.id}">{m.nollu_manage_groupName()}</Label>
          <Input id="name-{group.id}" name="name" bind:value={$form.name} />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="year-{group.id}">{m.nollu_manage_groupYear()}</Label>
          <Input
            id="year-{group.id}"
            name="year"
            type="number"
            bind:value={$form.year}
          />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="imageUrl-{group.id}">{m.nollu_manage_groupImage()}</Label>
        <Input
          id="imageUrl-{group.id}"
          name="imageUrl"
          bind:value={$form.imageUrl}
        />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="description-{group.id}"
          >{m.nollu_manage_groupDescription()}</Label
        >
        <Textarea
          id="description-{group.id}"
          name="description"
          bind:value={$form.description}
        />
      </div>
      {#if $errors.name}
        <p class="text-destructive text-sm font-medium">{$errors.name}</p>
      {/if}
      <div class="flex justify-end">
        <Button type="submit" size="sm">{m.nollu_manage_save()}</Button>
      </div>
    </form>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div class="flex flex-col gap-2">
        <h4 class="text-sm font-semibold">{m.nollor()}</h4>
        <div class="flex flex-wrap gap-1">
          {#each group.nollor as nolla (nolla.id)}
            <form method="POST" action="?/removeNolla" use:enhance>
              <input type="hidden" name="groupId" value={group.id} />
              <input type="hidden" name="studentId" value={nolla.studentId} />
              <Badge variant="outline" class="gap-1 pr-1">
                {nolla.firstName}
                {nolla.lastName}
                <button type="submit" class="hover:text-destructive" aria-label={m.delete_delete()}>
                  <X class="h-3 w-3" />
                </button>
              </Badge>
            </form>
          {/each}
        </div>
        <form
          method="POST"
          action="?/addNolla"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              newNolla = null;
            };
          }}
          class="flex gap-2"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <MemberSelector
            multiple={false}
            showId
            showClass
            name="studentId"
            bind:selectedMember={newNolla}
            inputClass="h-8"
          />
          <Button type="submit" size="icon-sm" variant="outline" aria-label={m.nollu_manage_addNolla()}>
            <Plus class="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div class="flex flex-col gap-2">
        <h4 class="text-sm font-semibold">{m.phaddrar()}</h4>
        <div class="flex flex-wrap gap-1">
          {#each group.phaddrar as phadder (phadder.id)}
            <form method="POST" action="?/removePhadder" use:enhance>
              <input type="hidden" name="groupId" value={group.id} />
              <input
                type="hidden"
                name="studentId"
                value={phadder.member.studentId}
              />
              <Badge variant="outline" class="gap-1 pr-1">
                {phadder.member.firstName}
                {phadder.member.lastName}
                <button type="submit" class="hover:text-destructive" aria-label={m.delete_delete()}>
                  <X class="h-3 w-3" />
                </button>
              </Badge>
            </form>
          {/each}
        </div>
        <form
          method="POST"
          action="?/addPhadder"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              newPhadder = null;
            };
          }}
          class="flex gap-2"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <MemberSelector
            multiple={false}
            showId
            showClass
            name="studentId"
            bind:selectedMember={newPhadder}
            inputClass="h-8"
          />
          <Button type="submit" size="icon-sm" variant="outline" aria-label={m.nollu_manage_addPhadder()}>
            <Plus class="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  </CardContent>
  <CardFooter class="justify-end">
    <AlertDialog.Root>
      <AlertDialog.Trigger class={buttonVariants({ variant: "destructive", size: "sm" })}>
        <Trash class="h-4 w-4" />
        {m.nollu_manage_deleteGroup()}
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>{m.nollu_manage_deleteGroup()}</AlertDialog.Title>
          <AlertDialog.Description>{group.name}</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
          <form method="POST" action="?/delete" use:enhance>
            <input type="hidden" name="id" value={group.id} />
            <AlertDialog.Action type="submit" class={buttonVariants({ variant: "destructive" })}>
              {m.delete_delete()}
            </AlertDialog.Action>
          </form>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </CardFooter>
</Card>
