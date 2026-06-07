<script lang="ts">
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { Checkbox } from "$lib/components/ui/checkbox/index";
  import Input from "$lib/components/ui/input/input.svelte";
  import { createExpense } from "./upload.remote";
  import FileUpload from "$lib/components/FileUpload.svelte";
  import * as m from "$paraglide/messages";
  import * as Select from "$lib/components/ui/select";
  import createBasicReceipt, { createBasicReceiptRow } from "../baseItem";
  import { COST_CENTERS } from "../config";
  import dayjs from "dayjs";
  import { Label } from "$lib/components/ui/label";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import PiggyBank from "@lucide/svelte/icons/piggy-bank";
  import Coins from "@lucide/svelte/icons/coins";
  import Pen from "@lucide/svelte/icons/pen";
  import Trash from "@lucide/svelte/icons/trash";
  import X from "@lucide/svelte/icons/x";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";

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
  <form
    class="flex flex-col gap-2"
    oninput={() => createExpense.validate()}
    {...createExpense.enhance(async (form) => {
      console.log(receipts[0]?.rows[0]?.costCenter.value());
      console.log(form.data.receipts[0]?.rows[0]?.costCenter);
      console.log(form.data.receipts[0]?.rows[0]?.amount);
      console.log(form.data);
      try {
        await form.submit();
      } catch (e) {
        console.log(e);
      }
    })}
    enctype="multipart/form-data"
  >
    <div class="flex flex-col gap-1.5">
      <Label>{m.receipt_date()}</Label>
      <DatePicker
        {...{
          ...date.as("date"),
          value: dayjs(today).format("YYYY-MM-DD"),
        }}
        class=""
        iso
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.is_guildCard()}</Label>
      <Checkbox
        {...{ ...isGuildCard.as("checkbox"), checked: false }}
        type={undefined}
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.expense_description()}</Label>
      <Input {...description.as("text")} />
    </div>
    <div class="flex flex-row flex-wrap gap-4">
      {#each receipts.value() as receipt, i (receipt)}
        <Card.Root>
          <Card.Content class="relative flex flex-col gap-2">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger class="absolute -top-4 right-2 ">
                  <Button
                    onclick={() =>
                      receipts.set([
                        ...receipts.value().filter((_, index) => index != i),
                      ])}
                    variant="outline"
                    size="icon-sm"
                    class="bg-background"><Trash /></Button
                  ></Tooltip.Trigger
                ><Tooltip.Content>
                  {m.remove_receipt()}
                </Tooltip.Content></Tooltip.Root
              >
            </Tooltip.Provider>
            <FileUpload allowUrl={false} {...receipts[i]!.image.as("file")} />

            {#each receipts[i]!.rows.value() as row, j (row)}
              {@const receiptRow = receipts[i]!.rows[j]!}
              <Separator
                orientation="horizontal"
                class={j == 0 ? "hidden" : ""}
              />
              <div class="flex flex-row gap-1">
                <div class="flex w-full flex-col gap-1.5">
                  <Label>{m.expense_type()}</Label>
                  {createExpense.fields.receipts[i]!.rows[
                    j
                  ]!.costCenter.value()}
                  <Select.Root
                    name="receipts[{i}].rows[{j}].costCenter"
                    type="single"
                    bind:value={receiptRow.costCenter.value,
                    (v) => receiptRow.costCenter.set(v ?? "INVALID")}
                  >
                    <Select.Trigger class="bg-background w-full"
                      ><PiggyBank />{receiptRow.costCenter
                        .as("text")
                        .value.toString()}
                    </Select.Trigger>
                    <Select.Content>
                      {#each costCenters as item (item.value)}
                        <Select.Item value={item.value}
                          >{item.label}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>
                <Separator orientation="vertical" class="mx-4 h-9! self-end" />
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger class="mb-1 self-end">
                      <Button
                        onclick={() =>
                          receipts[i]!.rows.set([
                            ...receipts[i]!.rows.value().filter(
                              (_, i) => i != j,
                            ),
                          ])}
                        variant="outline"
                        size="icon-sm"
                        class="bg-background"><X /></Button
                      ></Tooltip.Trigger
                    ><Tooltip.Content>
                      {m.remove_row()}
                    </Tooltip.Content></Tooltip.Root
                  >
                </Tooltip.Provider>
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>{m.expense_amount()}</Label>
                <Input {...receiptRow.amount.as("number")}><Coins /></Input>
              </div>
              <!--<div class="flex flex-col gap-1.5">
                <Label>{m.expense_amount()}</Label>
                <Input {...receiptRow.costCenter.as("text")}></Input>
              </div>-->
              <div class="flex flex-col gap-1.5">
                <Label>{m.receipt_comment()}</Label>
                <Input {...receiptRow.comment.as("text")}><Pen /></Input>
              </div>
            {/each}
            <Button
              variant="outline"
              class="bg-background"
              onclick={() =>
                receipts[i]!.rows.set([
                  ...receipts[i]!.rows.value(),
                  createBasicReceiptRow(),
                ])}>+ {m.add_row()}</Button
            >
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    <Button
      variant="outline"
      onclick={() => receipts.set([...receipts.value(), createBasicReceipt()])}
      >+ {m.add_receipt()}</Button
    >
    <Button type="submit">Submit</Button>
  </form>
</div>
