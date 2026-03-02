<script lang="ts">
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { Checkbox } from "$lib/components/ui/checkbox/index";
  import Input from "$lib/components/ui/input/input.svelte";
  import { CalendarDate } from "@internationalized/date";
  import { createExpense } from "./upload.remote";
  import FileUpload from "$lib/components/FileUpload.svelte";
  import { receipt } from "$paraglide/messages";
  import { Select } from "$lib/components/ui/select";
  import createBasicReceipt from "../baseItem";
  import { COST_CENTERS } from "../config";

  const { date, description, isGuildCard, receipts } = createExpense.fields;
  receipts.set([createBasicReceipt()]);
  const today = new Date();
  const costCenters = [
    { label: "Välj kostnadsställe", value: "" },
    ...COST_CENTERS.map((center) => ({
      label: `${center.name} - ${center.description} (${center.example})`,
      value: center.name,
    })),
  ];
</script>

<div>
  <form {...createExpense}>
    <div>
      Datum på kvitto: <DatePicker
        {...{
          ...date.as("date"),
          value: new CalendarDate(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
          ),
        }}
        class=""
        displayCompact
      />
    </div>

    <div>
      Är sektionskort: <Checkbox
        {...isGuildCard.as("checkbox")}
        type={undefined}
      />
    </div>
    <div>
      Beskrivning: <Input {...description.as("text")} />
    </div>
    {#each receipts.value() as receipt, i (receipt)}
      <FileUpload {...receipts[i]!.image.as("file")} />
      {#each receipts[i]!.rows.value() as row, j (row)}
        <Select
          {...receipts[i]!.rows[j]!.costCenter.as("select")}
          items={costCenters}
          type="single"
        />
      {/each}
    {/each}
    <button>hej</button>
  </form>
</div>
