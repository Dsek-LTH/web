<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button/";
  import * as Dialog from "$lib/components/ui/dialog/";
  import { Input } from "$lib/components/ui/input/";
  import { Label } from "$lib/components/ui/label/";
  import * as Select from "$lib/components/ui/select/";
  import * as Table from "$lib/components/ui/table/";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import * as m from "$paraglide/messages";
  import dayjs from "dayjs";
  import * as Card from "$lib/components/ui/card";

  let { data } = $props();

  let severityNames: Record<string, string> = {
    success: m.admin_alerts_severity_success(),
    info: m.admin_alerts_severity_info(),
    warning: m.admin_alerts_severity_warning(),
    error: m.admin_alerts_severity_error(),
  };

  // This is only used to display the selected severity.
  let severity = $state(undefined);
  let selectionTrigger = $derived(
    severity ? severityNames[severity] : m.admin_alerts_severity(),
  );
</script>

<SetPageTitle title={m.alerts()} />
<div class="layout-container">
  <h2 class="mb-4">{m.admin_alerts_globalMessages()}</h2>

  <Card.Root class="flex w-full flex-col items-start md:pr-16">
    <Card.Content class="w-full">
      <Card.Title class="text-lg">{m.admin_alerts_title()}</Card.Title>
      <form
        method="POST"
        action="?/create"
        class="flex w-full flex-col gap-8 pt-4 pb-8"
      >
        <div class="flex w-full flex-col gap-4">
          <div class="flex w-full max-w-lg flex-col gap-1.5">
            <Label for="messageSv">
              {m.admin_alerts_message_swedish()}
            </Label>
            <Input
              type="text"
              class="w-full"
              name="messageSv"
              minlength={1}
              required
            />
          </div>

          <div class="flex w-full max-w-lg flex-col gap-1.5">
            <Label for="messageEn">
              {m.admin_alerts_message_english()}
            </Label>
            <Input
              type="text"
              class="w-full"
              name="messageEn"
              minlength={1}
              required
            />
          </div>

          <div class="flex max-w-lg flex-col gap-1.5">
            <Label for="severity">
              {m.admin_alerts_severity()}
            </Label>
            <Select.Root
              type="single"
              name="severity"
              required
              bind:value={severity}
            >
              <Select.Trigger class="w-full">
                {selectionTrigger}
              </Select.Trigger>
              <Select.Content>
                {#each Object.entries(severityNames) as [identifier, name] (identifier)}
                  <Select.Item value={identifier}>
                    {name}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <Button class="w-fit" type="submit">{m.admin_alerts_create()}</Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  {#if data.alert.length > 0}
    <Table.Root class="mt-4">
      <Table.Header>
        <Table.Row>
          <Table.Head>{m.admin_alerts_severity()}</Table.Head>
          <Table.Head>{m.admin_alerts_message()}</Table.Head>
          <Table.Head>{m.admin_alerts_created()}</Table.Head>
          <Table.Head></Table.Head>
        </Table.Row>
      </Table.Header>
      {#each data.alert as alert (alert.id)}
        <Table.Row>
          <Table.Head>{severityNames[alert.severity]}</Table.Head>
          <Table.Cell>{alert.message}</Table.Cell>
          <Table.Cell
            >{dayjs(alert.createdAt).format("YYYY-MM-DD HH:mm:ss")}</Table.Cell
          >
          <Table.Cell class="center">
            <Dialog.Root>
              <Dialog.Trigger>
                <TrashIcon />
              </Dialog.Trigger>

              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>{m.admin_alerts_remove_alert()}</Dialog.Title>
                  <Dialog.Description>
                    {m.admin_alerts_remove_are_you_sure()}
                  </Dialog.Description>
                </Dialog.Header>
                <Dialog.Footer>
                  <form method="POST" action="?/delete">
                    <input type="hidden" name="id" value={alert.id} />
                    <Button type="submit"
                      >{m.admin_alerts_remove_alert()}</Button
                    >
                  </form>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Root>
          </Table.Cell>
        </Table.Row>
      {/each}
      <Table.Body></Table.Body>
    </Table.Root>
  {/if}
</div>
