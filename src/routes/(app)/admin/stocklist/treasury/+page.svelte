<script lang="ts">
  import { getLogs, updateLog, deleteLog } from "../stocklist.remote";
  import * as Table from "$lib/components/ui/table";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { enhanceWithToast } from "$lib/stores/toast";
  import { Spinner } from "$lib/components/ui/spinner";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash from "@lucide/svelte/icons/trash";
  import X from "@lucide/svelte/icons/x";
  import type { DrinkItem, DrinkItemBatch } from "@prisma/client";

  type LogWithItem = DrinkItemBatch & { item: DrinkItem };

  let dateFilter = $state<string>("");
  let logs = $derived((await getLogs(dateFilter)) ?? []);

  let isEditOpen = $state(false);
  let isDeleteOpen = $state(false);
  let selectedLog = $state<LogWithItem | null>(null);

  const editFields = updateLog.fields;

  function openEdit(log: LogWithItem) {
    selectedLog = log;
    editFields["id"]?.set(log.id);
    editFields["quantityDelta"]?.set(log.quantityDelta);
    editFields["nrBottlesDelta"]?.set(log.nrBottlesDelta ?? 0);
    isEditOpen = true;
  }

  function openDelete(log: LogWithItem) {
    selectedLog = log;
    isDeleteOpen = true;
  }
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4 font-sans">
  <div class="flex items-center gap-2">
    <div class="flex flex-col gap-1">
      <Label>Datum</Label>
      <DatePicker bind:value={dateFilter} iso />
    </div>
    {#if dateFilter}
      <Button
        variant="ghost"
        size="icon"
        onclick={() => (dateFilter = "")}
        class="mt-6"
      >
        <X size={16} />
      </Button>
    {/if}
  </div>
</div>

<!-- Table -->
<div class="bg-card rounded-lg border font-sans">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Datum</Table.Head>
        <Table.Head>Namn</Table.Head>
        <Table.Head>Antal/Vikt-ändring</Table.Head>
        <Table.Head>Flaskändring</Table.Head>
        <Table.Head>Användare</Table.Head>
        <Table.Head class="text-right">Åtgärder</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#if !logs}
        <Table.Row>
          <Table.Cell colspan={6} class="py-8 text-center">
            <Spinner />
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each logs as log (log.id)}
          <Table.Row>
            <Table.Cell
              >{new Date(log.date).toLocaleDateString("sv-SE")}</Table.Cell
            >
            <Table.Cell class="font-medium">{log.item.name}</Table.Cell>
            <Table.Cell
              class={log.quantityDelta >= 0
                ? "font-medium text-green-600"
                : "font-medium text-red-600"}
            >
              {log.quantityDelta >= 0 ? "+" : ""}{log.quantityDelta}
              {log.item.quantityType === "COUNTS" ? "st" : "g"}
            </Table.Cell>
            <Table.Cell>
              {#if log.item.quantityType === "WEIGHT" && log.nrBottlesDelta !== null}
                <span
                  class={log.nrBottlesDelta >= 0
                    ? "text-green-600"
                    : "text-red-600"}
                >
                  {log.nrBottlesDelta >= 0 ? "+" : ""}{log.nrBottlesDelta} fl
                </span>
              {:else}
                -
              {/if}
            </Table.Cell>
            <Table.Cell class="font-mono text-xs">{log.user}</Table.Cell>
            <Table.Cell class="flex justify-end gap-1 text-right">
              <Button
                size="icon-sm"
                variant="outline"
                onclick={() => openEdit(log)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                size="icon-sm"
                variant="destructive"
                onclick={() => openDelete(log)}
              >
                <Trash size={14} />
              </Button>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell
              colspan={6}
              class="text-center py-8 text-muted-foreground"
            >
              Inga transaktionsloggar hittades.
            </Table.Cell>
          </Table.Row>
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>

<!-- Edit Log Dialog -->
<Dialog.Root bind:open={isEditOpen}>
  <Dialog.Content class="font-sans">
    <Dialog.Header>
      <Dialog.Title>Redigera loggrad</Dialog.Title>
    </Dialog.Header>
    <form
      class="flex flex-col gap-4 py-2"
      oninput={() => updateLog.validate()}
      {...enhanceWithToast(updateLog, async (f) => {
        await f.submit();
        isEditOpen = false;
        getLogs(dateFilter).refresh();
      })}
    >
      <Input type="hidden" {...editFields["id"]?.as("text")} />

      <div class="flex flex-col gap-1.5">
        <Label for="log-q-delta">Antal/Vikt-ändring</Label>
        <Input
          id="log-q-delta"
          {...editFields["quantityDelta"]?.as("number")}
        />
      </div>

      {#if selectedLog?.item.quantityType === "WEIGHT"}
        <div class="flex flex-col gap-1.5">
          <Label for="log-b-delta">Flaskändring</Label>
          <Input
            id="log-b-delta"
            {...editFields["nrBottlesDelta"]?.as("number")}
          />
        </div>
      {/if}

      <div class="mt-4 flex justify-end gap-2">
        <Button variant="outline" onclick={() => (isEditOpen = false)}>
          Avbryt
        </Button>
        <Button type="submit" disabled={updateLog.pending > 0}>
          {#if updateLog.pending > 0}
            <Spinner class="mr-2" />
          {/if}
          Spara
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Log Dialog -->
<AlertDialog.Root bind:open={isDeleteOpen}>
  <AlertDialog.Content class="font-sans">
    <AlertDialog.Header>
      <AlertDialog.Title>Ta bort loggrad</AlertDialog.Title>
      <AlertDialog.Description>
        Är du säker på att du vill ta bort den här loggraden? Detta kommer att
        återställa lagersaldot.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (isDeleteOpen = false)}>
        Avbryt
      </AlertDialog.Cancel>
      <AlertDialog.Action
        class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        onclick={async () => {
          if (selectedLog) {
            const res = await deleteLog(selectedLog.id);
            if (res.type === "success") {
              getLogs(dateFilter).refresh();
              isDeleteOpen = false;
            }
          }
        }}
      >
        Ta bort loggrad
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
