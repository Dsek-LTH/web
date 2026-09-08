<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import Pagination from "$lib/components/Pagination.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Plus from "@lucide/svelte/icons/plus";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import dayjs from "dayjs";
  import type { ShlinkShortUrl } from "@shlinkio/shlink-js-sdk/api-contract";

  let { data } = $props();

  let createOpen = $state(false);
  let editOpen = $state(false);
  let editingSlug = $state<string | null>(null);
  let selected = $state<string[]>([]);

  function tagsToArray(raw: string): string[] {
    return raw
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // svelte-ignore state_referenced_locally
  const createForm = superForm(data.createLinksForm, {
    id: "create",
    onUpdated: ({ form }) => {
      if (form.valid) {
        createOpen = false;
        createTagsRaw = "";
      }
    },
  });
  const {
    form: createFormData,
    errors: createErrors,
    enhance: createEnhance,
  } = createForm;
  let createTagsRaw = $state("");

  // svelte-ignore state_referenced_locally
  const updateForm = superForm(data.updateLinksForm, {
    id: "update",
    onUpdated: ({ form }) => {
      if (form.valid) editOpen = false;
    },
  });
  const {
    form: updateFormData,
    errors: updateErrors,
    enhance: updateEnhance,
  } = updateForm;
  let updateTagsRaw = $state("");

  // svelte-ignore state_referenced_locally
  const { enhance: deleteEnhance } = superForm(data.updateLinksForm, {
    id: "delete-links",
    onUpdated: ({ form }) => {
      if (form.valid) selected = [];
    },
  });

  function startEdit(link: ShlinkShortUrl) {
    editingSlug = link.shortCode;
    $updateFormData.slug = link.shortCode;
    $updateFormData.url = link.longUrl;
    $updateFormData.tags = link.tags;
    updateTagsRaw = link.tags.join("; ");
    editOpen = true;
  }
</script>

<SetPageTitle title={m.admin_links_table_title()} />

<div class="mx-auto max-w-5xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">{m.admin_links_table_title()}</h1>
    <div class="flex items-center gap-2">
      {#if selected.length > 0}
        <AlertDialog.Root>
          <AlertDialog.Trigger
            class={buttonVariants({ variant: "destructive" })}
          >
            <Trash class="h-4 w-4" />
            {m.admin_links_remove_submit()} ({selected.length})
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>{m.admin_links_remove_title()}</AlertDialog.Title>
              <AlertDialog.Description>
                {m.admin_links_remove_confirmation({ amount: selected.length })}
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
              <form method="POST" action="?/delete" use:deleteEnhance>
                {#each selected as slug (slug)}
                  <input type="hidden" name="deleting" value={slug} />
                {/each}
                <AlertDialog.Action type="submit" class={buttonVariants({ variant: "destructive" })}>
                  {m.admin_links_remove_submit()}
                </AlertDialog.Action>
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>
      {/if}
      <Button
        class="flex items-center gap-2"
        onclick={() => (createOpen = true)}
      >
        <Plus class="h-4 w-4" />
        {m.admin_links_add_title()}
      </Button>
    </div>
  </div>

  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-8"></Table.Head>
        <Table.Head>{m.admin_links_table_header_slug()}</Table.Head>
        <Table.Head>{m.admin_links_table_header_url()}</Table.Head>
        <Table.Head>{m.admin_links_table_header_tags()}</Table.Head>
        <Table.Head>{m.admin_links_table_header_visits()}</Table.Head>
        <Table.Head>{m.admin_links_table_header_created()}</Table.Head>
        <Table.Head class="w-8"></Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.domains as link (link.shortCode)}
        <Table.Row>
          <Table.Cell>
            <Checkbox
              checked={selected.includes(link.shortCode)}
              onCheckedChange={(v) => {
                selected = v
                  ? [...selected, link.shortCode]
                  : selected.filter((s) => s !== link.shortCode);
              }}
            />
          </Table.Cell>
          <Table.Cell class="font-medium">{link.shortCode}</Table.Cell>
          <Table.Cell class="max-w-xs truncate">
            <a
              href={link.longUrl}
              target="_blank"
              class="text-muted-foreground flex items-center gap-1 hover:underline"
            >
              <ExternalLink class="h-3 w-3 shrink-0" />
              <span class="truncate">{link.longUrl}</span>
            </a>
          </Table.Cell>
          <Table.Cell>
            <div class="flex flex-wrap gap-1">
              {#each link.tags as tag (tag)}
                <Badge variant="outline">{tag}</Badge>
              {/each}
            </div>
          </Table.Cell>
          <Table.Cell>{link.visitsSummary?.total ?? 0}</Table.Cell>
          <Table.Cell>{dayjs(link.dateCreated).format("YYYY-MM-DD")}</Table.Cell>
          <Table.Cell>
            <Button
              variant="ghost"
              size="icon-sm"
              onclick={() => startEdit(link)}
              aria-label={m.admin_links_edit_title()}
            >
              <Pen class="h-4 w-4" />
            </Button>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  <Pagination pageCount={data.pagination.pagesCount} class="mt-6" />
</div>

<Dialog.Root bind:open={createOpen}>
  <Dialog.Content>
    <form method="POST" action="?/create" use:createEnhance class="flex flex-col gap-4">
      <Dialog.Header>
        <Dialog.Title>{m.admin_links_add_title()}</Dialog.Title>
      </Dialog.Header>
      <div class="flex flex-col gap-2">
        <Label for="create-slug">{m.admin_links_add_label_slug()}</Label>
        <Input
          id="create-slug"
          name="slug"
          placeholder={m.admin_links_add_placeholder_slug()}
          bind:value={$createFormData.slug}
        />
        {#if $createErrors.slug}
          <p class="text-destructive text-sm font-medium">{$createErrors.slug}</p>
        {/if}
      </div>
      <div class="flex flex-col gap-2">
        <Label for="create-url">{m.admin_links_add_label_URL()}</Label>
        <Input
          id="create-url"
          name="url"
          placeholder={m.admin_links_add_placeholder_URL()}
          bind:value={$createFormData.url}
        />
        {#if $createErrors.url}
          <p class="text-destructive text-sm font-medium">{$createErrors.url}</p>
        {/if}
      </div>
      <div class="flex flex-col gap-2">
        <Label for="create-tags">{m.admin_links_add_label_tags()}</Label>
        <Input
          id="create-tags"
          placeholder={m.admin_links_add_placeholder_tags()}
          bind:value={createTagsRaw}
          oninput={() => ($createFormData.tags = tagsToArray(createTagsRaw))}
        />
        {#each $createFormData.tags as tag (tag)}
          <input type="hidden" name="tags" value={tag} />
        {/each}
        {#if $createErrors.tags}
          <p class="text-destructive text-sm font-medium">{$createErrors.tags}</p>
        {/if}
      </div>
      <Dialog.Footer>
        <Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}>
          {m.admin_links_edit_cancel()}
        </Dialog.Close>
        <Button type="submit">{m.admin_links_add_submit()}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editOpen}>
  <Dialog.Content>
    <form method="POST" action="?/update" use:updateEnhance class="flex flex-col gap-4">
      <input type="hidden" name="slug" value={editingSlug} />
      <Dialog.Header>
        <Dialog.Title>{m.admin_links_edit_title()}</Dialog.Title>
      </Dialog.Header>
      <div class="flex flex-col gap-2">
        <Label for="update-url">{m.admin_links_add_label_URL()}</Label>
        <Input id="update-url" name="url" bind:value={$updateFormData.url} />
        {#if $updateErrors.url}
          <p class="text-destructive text-sm font-medium">{$updateErrors.url}</p>
        {/if}
      </div>
      <div class="flex flex-col gap-2">
        <Label for="update-tags">{m.admin_links_add_label_tags()}</Label>
        <Input
          id="update-tags"
          placeholder={m.admin_links_add_placeholder_tags()}
          bind:value={updateTagsRaw}
          oninput={() => ($updateFormData.tags = tagsToArray(updateTagsRaw))}
        />
        {#each $updateFormData.tags as tag (tag)}
          <input type="hidden" name="tags" value={tag} />
        {/each}
        {#if $updateErrors.tags}
          <p class="text-destructive text-sm font-medium">{$updateErrors.tags}</p>
        {/if}
      </div>
      <Dialog.Footer>
        <Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}>
          {m.admin_links_edit_cancel()}
        </Dialog.Close>
        <Button type="submit">{m.admin_links_edit_submit()}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
