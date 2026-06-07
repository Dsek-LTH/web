<script lang="ts">
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { Checkbox } from "$lib/components/ui/checkbox/index";
  import Input from "$lib/components/ui/input/input.svelte";
  import { CalendarDate } from "@internationalized/date";
  import { createExpense } from "./upload.remote";
  import FileUpload from "$lib/components/FileUpload.svelte";
  import * as m from "$paraglide/messages";
  import * as Select from "$lib/components/ui/select";
  import createBasicReceipt from "../baseItem";
  import { COST_CENTERS } from "../config";
  import dayjs from "dayjs";
  import { Label } from "$lib/components/ui/label";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import PiggyBank from "@lucide/svelte/icons/piggy-bank";
  import Coins from "@lucide/svelte/icons/coins";
  import Pen from "@lucide/svelte/icons/pen";

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
  <form {...createExpense} enctype="multipart/form-data">
    <div>
      Datum på kvitto: <DatePicker
        {...{
          ...date.as("date"),
          value: dayjs(today).format("YYYY-MM-DD"),
        }}
        class=""
        iso
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
      <Card.Root>
        <Card.Content class="flex flex-col gap-2">
          <FileUpload allowUrl={false} {...receipts[i]!.image.as("file")} />
          {#each receipts[i]!.rows.value() as row, j (row)}
            {@const receipt = receipts[i]!.rows[j]!}
            <div class="flex flex-col gap-1.5">
              <Label>{m.expense_type()}</Label>
              <Select.Root
                {...receipts[i]!.rows[j]!.costCenter.as("text")}
                items={costCenters}
                type="single"
                bind:value={receipt.costCenter.as("select").value
                  ? receipt.costCenter.as("select").value.toString
                  : () => undefined,
                (v) => receipt.costCenter.set(v ?? "")}
                ><Select.Trigger class="w-full"
                  ><PiggyBank />{receipt.costCenter
                    .as("select")
                    .value.toString()}</Select.Trigger
                >
                <Select.Content>
                  {#each costCenters as item (item.value)}
                    <Select.Item value={item.value}>{item.label}</Select.Item>
                  {/each}
                </Select.Content></Select.Root
              >
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{m.expense_amount()}</Label>
              <Input {...receipt.amount.as("number")}><Coins /></Input>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{m.receipt_comment()}</Label>
              <Input {...receipt.comment.as("text")}><Pen /></Input>
            </div>
          {/each}
        </Card.Content>
      </Card.Root>
    {/each}
    <Button>Submit</Button>
  </form>
</div>
