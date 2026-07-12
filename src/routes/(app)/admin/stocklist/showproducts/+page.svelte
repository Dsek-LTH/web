<script lang="ts">
  import {
    getProducts,
    createDrinkItem,
    updateDrinkItem,
    deleteDrinkItem,
  } from "../stocklist.remote";
  import * as Table from "$lib/components/ui/table";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { enhanceWithToast } from "$lib/stores/toast";
  import { Spinner } from "$lib/components/ui/spinner";
  import Plus from "@lucide/svelte/icons/plus";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash from "@lucide/svelte/icons/trash";
  import Search from "@lucide/svelte/icons/search";
  import type { DrinkItem } from "@prisma/client";

  let products = $derived(await getProducts());
  let searchQuery = $state("");

  // Dialog & Form states
  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let isDeleteOpen = $state(false);
  let selectedProduct = $state<DrinkItem | null>(null);

  // Form Fields mapping
  const addFields = createDrinkItem.fields;
  const editFields = updateDrinkItem.fields;

  // Drink Groups List
  const drinkGroups = ["S1", "S2", "S3", "S4"];

  // Filter products by query
  let filteredProducts = $derived.by(() => {
    const list = products ?? [];
    if (!searchQuery) return list;
    return list.filter(
      (p: DrinkItem) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.systembolagetID.toString().includes(searchQuery),
    );
  });

  function resetAddForm() {
    addFields["name"]?.set("");
    addFields["systembolagetID"]?.set(0);
    addFields["price"]?.set(0);
    addFields["group"]?.set("S1");
    addFields["quantityType"]?.set("COUNTS");
    addFields["bottleEmptyWeight"]?.set(undefined);
    addFields["bottleFullWeight"]?.set(undefined);
  }

  function openEdit(product: DrinkItem) {
    selectedProduct = product;
    editFields["id"]?.set(product.id);
    editFields["name"]?.set(product.name);
    editFields["systembolagetID"]?.set(product.systembolagetID);
    editFields["price"]?.set(product.price / 100);
    editFields["group"]?.set(product.group);
    editFields["quantityType"]?.set(product.quantityType);
    editFields["bottleEmptyWeight"]?.set(
      product.bottleEmptyWeight ?? undefined,
    );
    editFields["bottleFullWeight"]?.set(product.bottleFullWeight ?? undefined);
    isEditOpen = true;
  }

  function openDelete(product: DrinkItem) {
    selectedProduct = product;
    isDeleteOpen = true;
  }
</script>

<div
  class="mb-6 flex flex-col justify-between gap-4 font-sans md:flex-row md:items-center"
>
  <div class="relative w-full max-w-sm">
    <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
    <Input
      type="search"
      placeholder="Sök efter produkt..."
      class="bg-card pl-9"
      bind:value={searchQuery}
    />
  </div>
  <Button
    onclick={() => {
      resetAddForm();
      isAddOpen = true;
    }}
  >
    <Plus size={16} class="mr-2" />
    Lägg till ny produkt
  </Button>
</div>

<!-- Table -->
<div class="bg-card rounded-lg border font-sans">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Systembolaget-ID</Table.Head>
        <Table.Head>Namn</Table.Head>
        <Table.Head>Inköpspris</Table.Head>
        <Table.Head>Grupp</Table.Head>
        <Table.Head>Kvantitetstyp</Table.Head>
        <Table.Head>Tomvikt flaska (g)</Table.Head>
        <Table.Head>Fullvikt flaska (g)</Table.Head>
        <Table.Head class="text-right">Åtgärder</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#if !products}
        <Table.Row>
          <Table.Cell colspan={8} class="py-8 text-center">
            <Spinner />
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each filteredProducts as product (product.id)}
          <Table.Row>
            <Table.Cell class="font-mono">{product.systembolagetID}</Table.Cell>
            <Table.Cell class="font-medium">{product.name}</Table.Cell>
            <Table.Cell>{(product.price / 100).toFixed(2)} kr</Table.Cell>
            <Table.Cell
              ><span class="badge badge-outline">{product.group}</span
              ></Table.Cell
            >
            <Table.Cell>
              {product.quantityType === "COUNTS"
                ? "Antal (Öl/Cider/Vin)"
                : "Vikt/Mängd (Sprit)"}
            </Table.Cell>
            <Table.Cell>{product.bottleEmptyWeight || "-"}</Table.Cell>
            <Table.Cell>{product.bottleFullWeight || "-"}</Table.Cell>
            <Table.Cell class="flex justify-end gap-1 text-right">
              <Button
                size="icon-sm"
                variant="outline"
                onclick={() => openEdit(product)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                size="icon-sm"
                variant="destructive"
                onclick={() => openDelete(product)}
              >
                <Trash size={14} />
              </Button>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell
              colspan={8}
              class="text-center py-8 text-muted-foreground"
            >
              Inga produkter hittades.
            </Table.Cell>
          </Table.Row>
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>

<!-- Add Dialog -->
<Dialog.Root bind:open={isAddOpen}>
  <Dialog.Content class="font-sans">
    <Dialog.Header>
      <Dialog.Title>Lägg till ny produkt</Dialog.Title>
    </Dialog.Header>
    <form
      class="flex flex-col gap-4 py-2"
      oninput={() => createDrinkItem.validate()}
      {...enhanceWithToast(createDrinkItem, async (f) => {
        await f.submit();
        isAddOpen = false;
        getProducts().refresh();
      })}
    >
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <Label for="add-name">Namn</Label>
          <Input id="add-name" {...addFields["name"]?.as("text")} />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="add-sb-id">Systembolaget-ID</Label>
          <Input
            id="add-sb-id"
            {...addFields["systembolagetID"]?.as("number")}
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <Label for="add-price">Pris (kr)</Label>
          <Input
            id="add-price"
            step="0.01"
            {...addFields["price"]?.as("number")}
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Grupp</Label>
          <Select.Root
            type="single"
            bind:value={addFields["group"]!.value,
            (v) => addFields["group"]!.set(v ?? "S1")}
          >
            <Select.Trigger class="w-full">
              {addFields["group"]?.value() || "Välj grupp"}
            </Select.Trigger>
            <Select.Content>
              {#each drinkGroups as group (group)}
                <Select.Item value={group}>{group}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>Kvantitetstyp</Label>
        <Select.Root
          type="single"
          bind:value={addFields["quantityType"]!.value,
          (v) => {
            addFields["quantityType"]!.set(v ?? "COUNTS");
            if (v === "COUNTS") {
              addFields["bottleEmptyWeight"]?.set(undefined);
              addFields["bottleFullWeight"]?.set(undefined);
            }
          }}
        >
          <Select.Trigger class="w-full">
            {addFields["quantityType"]?.value() === "COUNTS"
              ? "Antal (Öl/Cider/Vin)"
              : "Vikt/Mängd (Sprit)"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="COUNTS">Antal (Öl/Cider/Vin)</Select.Item>
            <Select.Item value="WEIGHT">Vikt/Mängd (Sprit)</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      {#if addFields["quantityType"]?.value() === "WEIGHT"}
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <Label for="add-empty">Tomvikt flaska (g)</Label>
            <Input
              id="add-empty"
              {...addFields["bottleEmptyWeight"]?.as("number")}
            />
          </div>
          <div class="flex flex-col gap-1">
            <Label for="add-full">Fullvikt flaska (g)</Label>
            <Input
              id="add-full"
              {...addFields["bottleFullWeight"]?.as("number")}
            />
          </div>
        </div>
      {/if}

      <div class="mt-4 flex justify-end gap-2">
        <Button variant="outline" onclick={() => (isAddOpen = false)}>
          Avbryt
        </Button>
        <Button type="submit" disabled={createDrinkItem.pending > 0}>
          {#if createDrinkItem.pending > 0}
            <Spinner class="mr-2" />
          {/if}
          Spara
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root bind:open={isEditOpen}>
  <Dialog.Content class="font-sans">
    <Dialog.Header>
      <Dialog.Title>Redigera produkt</Dialog.Title>
    </Dialog.Header>
    <form
      class="flex flex-col gap-4 py-2"
      oninput={() => updateDrinkItem.validate()}
      {...enhanceWithToast(updateDrinkItem, async (f) => {
        await f.submit();
        isEditOpen = false;
        getProducts().refresh();
      })}
    >
      <Input type="hidden" {...editFields["id"]?.as("text")} />

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <Label for="edit-name">Namn</Label>
          <Input id="edit-name" {...editFields["name"]?.as("text")} />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="edit-sb-id">Systembolaget-ID</Label>
          <Input
            id="edit-sb-id"
            {...editFields["systembolagetID"]?.as("number")}
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <Label for="edit-price">Pris (kr)</Label>
          <Input
            id="edit-price"
            step="0.01"
            {...editFields["price"]?.as("number")}
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Grupp</Label>
          <Select.Root
            type="single"
            bind:value={editFields["group"]!.value,
            (v) => editFields["group"]!.set(v ?? "S1")}
          >
            <Select.Trigger class="w-full">
              {editFields["group"]?.value() || "Välj grupp"}
            </Select.Trigger>
            <Select.Content>
              {#each drinkGroups as group (group)}
                <Select.Item value={group}>{group}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>Kvantitetstyp</Label>
        <Select.Root
          type="single"
          bind:value={editFields["quantityType"]!.value,
          (v) => {
            editFields["quantityType"]!.set(v ?? "COUNTS");
            if (v === "COUNTS") {
              editFields["bottleEmptyWeight"]?.set(undefined);
              editFields["bottleFullWeight"]?.set(undefined);
            }
          }}
        >
          <Select.Trigger class="w-full">
            {editFields["quantityType"]?.value() === "COUNTS"
              ? "Antal (Öl/Cider/Vin)"
              : "Vikt/Mängd (Sprit)"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="COUNTS">Antal (Öl/Cider/Vin)</Select.Item>
            <Select.Item value="WEIGHT">Vikt/Mängd (Sprit)</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      {#if editFields["quantityType"]?.value() === "WEIGHT"}
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <Label for="edit-empty">Tomvikt flaska (g)</Label>
            <Input
              id="edit-empty"
              {...editFields["bottleEmptyWeight"]?.as("number")}
            />
          </div>
          <div class="flex flex-col gap-1">
            <Label for="edit-full">Fullvikt flaska (g)</Label>
            <Input
              id="edit-full"
              {...editFields["bottleFullWeight"]?.as("number")}
            />
          </div>
        </div>
      {/if}

      <div class="mt-4 flex justify-end gap-2">
        <Button variant="outline" onclick={() => (isEditOpen = false)}>
          Avbryt
        </Button>
        <Button type="submit" disabled={updateDrinkItem.pending > 0}>
          {#if updateDrinkItem.pending > 0}
            <Spinner class="mr-2" />
          {/if}
          Spara
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Dialog -->
<AlertDialog.Root bind:open={isDeleteOpen}>
  <AlertDialog.Content class="font-sans">
    <AlertDialog.Header>
      <AlertDialog.Title>Ta bort produkt</AlertDialog.Title>
      <AlertDialog.Description>
        Är du säker på att du vill ta bort den här produkten?
        {#if selectedProduct}
          <div class="text-foreground mt-2 font-semibold">
            {selectedProduct.name}
          </div>
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (isDeleteOpen = false)}>
        Avbryt
      </AlertDialog.Cancel>
      <AlertDialog.Action
        class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        onclick={async () => {
          if (selectedProduct) {
            const res = await deleteDrinkItem(selectedProduct.id);
            if (res.type === "success") {
              getProducts().refresh();
              isDeleteOpen = false;
            }
          }
        }}
      >
        Ta bort produkt
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
