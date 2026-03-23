<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button/";
  import * as Dialog from "$lib/components/ui/dialog/";
  import { Input } from "$lib/components/ui/input/";
  import { Label } from "$lib/components/ui/label/";
  import * as Select from "$lib/components/ui/select/";
  import * as Table from "$lib/components/ui/table/";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import * as messages from "$paraglide/messages";
  import dayjs from "dayjs";

  let { data } = $props();

  let severityNames: Record<string, string> = {
    success: messages.admin_alerts_severity_success(),
    info: messages.admin_alerts_severity_info(),
    warning: messages.admin_alerts_severity_warning(),
    error: messages.admin_alerts_severity_error(),
  };

  // This is only used to display the selected severity.
  let severity = $state(undefined);
  let selectionTrigger = $derived(
    severity ? severityNames[severity] : messages.admin_alerts_severity(),
  );
</script>

<SetPageTitle title={messages.alerts()} />

<h1 class="w-full text-center">{messages.admin_alerts_title()}</h1>

<form
  method="POST"
  action="?/create"
  class="flex w-full flex-col items-center gap-8 pt-4 pb-8"
>
  <div class="flex w-lg flex-col items-center gap-4">
    <Label for="messageSv">
      {messages.admin_alerts_message_swedish()}
    </Label>
    <Input type="text" name="messageSv" minlength={1} required />

    <Label for="messageEn">
      {messages.admin_alerts_message_english()}
    </Label>
    <Input type="text" name="messageEn" minlength={1} required />

    <Label for="severity">
      {messages.admin_alerts_severity()}
    </Label>
    <Select.Root type="single" name="severity" required bind:value={severity}>
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

  <Button type="submit">{messages.admin_alerts_create()}</Button>
</form>

{#if data.alert.length > 0}
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>{messages.admin_alerts_severity()}</Table.Head>
        <Table.Head>{messages.admin_alerts_message()}</Table.Head>
        <Table.Head>{messages.admin_alerts_created()}</Table.Head>
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
                <Dialog.Title
                  >{messages.admin_alerts_remove_alert()}</Dialog.Title
                >
                <Dialog.Description>
                  {messages.admin_alerts_remove_are_you_sure()}
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.Footer>
                <form method="POST" action="?/delete">
                  <input type="hidden" name="id" value={alert.id} />
                  <Button type="submit"
                    >{messages.admin_alerts_remove_alert()}</Button
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
