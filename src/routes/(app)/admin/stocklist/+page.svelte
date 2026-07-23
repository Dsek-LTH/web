<script lang="ts">
  import { getStockOverview, uploadCSV } from "./stocklist.remote";
  import * as Card from "$lib/components/ui/card";
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import FileUpload from "$lib/components/FileUpload.svelte";
  import { enhanceWithToast } from "$lib/stores/toast";
  import { Spinner } from "$lib/components/ui/spinner";
  import Coins from "@lucide/svelte/icons/coins";
  import Upload from "@lucide/svelte/icons/upload";
  import type { DrinkItem } from "@prisma/client";

  let data = $derived(await getStockOverview());
  const { file } = uploadCSV.fields;

  function calcBottles(item: DrinkItem) {
    if (
      item.bottleEmptyWeight &&
      item.bottleFullWeight &&
      item.bottleEmptyWeight !== 0 &&
      item.bottleFullWeight !== 0 &&
      item.quantityAvailable !== null &&
      item.nrBottles !== null
    ) {
      const liquidWeight =
        item.quantityAvailable - item.nrBottles * item.bottleEmptyWeight;
      const bottleCapacity = item.bottleFullWeight - item.bottleEmptyWeight;
      return (liquidWeight / bottleCapacity).toFixed(2) + " st";
    }
    return (item.quantityAvailable ?? 0) + " g";
  }
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
  <!-- Value Card -->
  <Card.Root
    class="bg-radial-gradient from-rosa-background/20 border-rosa-border/30 relative overflow-hidden border to-transparent font-sans shadow-lg md:col-span-2"
  >
    <Card.Content class="flex items-center gap-6 pt-6">
      <div class="bg-rosa/20 text-rosa rounded-full p-4">
        <Coins size={36} />
      </div>
      <div>
        <p class="text-muted-foreground text-sm font-medium">
          Totalt lagervärde
        </p>
        <h2 class="text-foreground text-3xl font-bold tracking-tight">
          {#if data}
            {data.currentInventoryValue.toFixed(2)} kr
          {:else}
            <Spinner class="inline" />
          {/if}
        </h2>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Upload CSV Card -->
  <Card.Root class="font-sans">
    <Card.Content class="pt-6">
      <form
        class="flex flex-col gap-3"
        oninput={() => uploadCSV.validate()}
        {...enhanceWithToast(uploadCSV, async (f) => {
          await f.submit();
          getStockOverview().refresh();
        })}
        enctype="multipart/form-data"
      >
        <FileUpload
          aria-errormessage={file.issues()?.at(0)?.message}
          allowUrl={false}
          {...file.as("file")}
        />
        <Button type="submit" disabled={uploadCSV.pending > 0} class="w-full">
          {#if uploadCSV.pending > 0}
            <Spinner class="mr-2" />
          {:else}
            <Upload size={16} class="mr-2" />
          {/if}
          Ladda upp CSV
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>

<!-- Stock Table -->
<div class="bg-card mt-8 rounded-lg border font-sans">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Systembolaget-ID</Table.Head>
        <Table.Head>Namn</Table.Head>
        <Table.Head>Kategori</Table.Head>
        <Table.Head>Pris</Table.Head>
        <Table.Head>Lagersaldo</Table.Head>
        <Table.Head>Grupp</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#if !data}
        <Table.Row>
          <Table.Cell colspan={6} class="py-8 text-center">
            <Spinner />
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each data.drinkItems as item (item.id)}
          <Table.Row>
            <Table.Cell class="font-mono">{item.systembolagetID}</Table.Cell>
            <Table.Cell class="font-medium">{item.name}</Table.Cell>
            <Table.Cell>
              {#if item.quantityType === "COUNTS"}
                {item.group === "S3" ? "Vin" : "Öl/Cider"}
              {:else}
                Sprit
              {/if}
            </Table.Cell>
            <Table.Cell>{(item.price / 100).toFixed(2)} kr</Table.Cell>
            <Table.Cell>
              {#if item.quantityType === "COUNTS"}
                {item.quantityAvailable} st
              {:else}
                {calcBottles(item)} ({item.quantityAvailable} g)
              {/if}
            </Table.Cell>
            <Table.Cell
              ><span class="badge badge-outline">{item.group}</span></Table.Cell
            >
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell
              colspan={6}
              class="text-center py-8 text-muted-foreground"
            >
              Inga produkter i lager för tillfället.
            </Table.Cell>
          </Table.Row>
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>
