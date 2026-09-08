<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { enhance } from "$app/forms";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance: nollningEnhance } = superForm(
    data.updateNollningForm,
    { id: "nollning" },
  );
</script>

<SetPageTitle title={m.admin_settings_pageTitle()} />

<div class="mx-auto max-w-3xl px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">{m.admin_settings_pageTitle()}</h1>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.admin_settings_nollningPeriod()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/updateNollning"
        use:nollningEnhance
        class="flex flex-wrap items-end gap-4"
      >
        <div class="flex flex-col gap-1.5">
          <Label>{m.admin_settings_nollningStart()}</Label>
          <DatePicker
            name="start"
            iso
            value={data.nollning?.start.toISOString().split("T")[0] ??
              $form.start?.toISOString().split("T")[0]}
            error={!!$errors.start}
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{m.admin_settings_nollningEnd()}</Label>
          <DatePicker
            name="end"
            iso
            value={data.nollning?.end.toISOString().split("T")[0] ??
              $form.end?.toISOString().split("T")[0]}
            error={!!$errors.end}
          />
        </div>
        <Button type="submit">{m.admin_settings_save()}</Button>
      </form>
    </CardContent>
  </Card>

  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{m.admin_settings_addNew()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/update"
        use:enhance
        class="flex flex-wrap items-end gap-4"
      >
        <div class="flex flex-1 flex-col gap-1.5">
          <Label for="new-key">{m.admin_settings_key()}</Label>
          <Input id="new-key" name="key" required />
        </div>
        <div class="flex flex-1 flex-col gap-1.5">
          <Label for="new-value">{m.admin_settings_value()}</Label>
          <Input id="new-value" name="value" required />
        </div>
        <Button type="submit" class="flex items-center gap-2">
          <Plus class="h-4 w-4" />
          {m.admin_settings_save()}
        </Button>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardContent class="flex flex-col divide-y">
      {#each data.settings as setting (setting.key)}
        <form
          method="POST"
          action="?/update"
          use:enhance
          class="flex flex-wrap items-end gap-4 py-3"
        >
          <input type="hidden" name="key" value={setting.key} />
          <div class="flex flex-col gap-1">
            <Label>{m.admin_settings_key()}</Label>
            <p class="text-sm font-medium">{setting.key}</p>
          </div>
          <div class="flex flex-1 flex-col gap-1.5">
            <Label for="value-{setting.key}">{m.admin_settings_value()}</Label>
            <Input
              id="value-{setting.key}"
              name="value"
              value={setting.value}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            {m.admin_settings_save()}
          </Button>
          <Button
            type="submit"
            formaction="?/remove"
            variant="ghost"
            size="icon-sm"
            aria-label={m.delete_delete()}
          >
            <Trash class="h-4 w-4" />
          </Button>
        </form>
      {/each}
    </CardContent>
  </Card>
</div>
