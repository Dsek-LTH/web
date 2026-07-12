<script lang="ts">
  import { getProducts, createStockchange } from "../stocklist.remote";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import { enhanceWithToast } from "$lib/stores/toast";
  import { Spinner } from "$lib/components/ui/spinner";
  import Search from "@lucide/svelte/icons/search";
  import dayjs from "dayjs";
  import type { DrinkItem } from "@prisma/client";

  let products = $derived((await getProducts()) ?? []);
  let searchQuery = $state("");
  let selectedProduct = $state<DrinkItem | null>(null);
  let activeTab = $state<"IN" | "OUT">("IN");

  const fields = createStockchange.fields;

  let matches = $derived.by(() => {
    if (!searchQuery) return [];
    return products
      .filter(
        (p: DrinkItem) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.systembolagetID.toString().includes(searchQuery),
      )
      .slice(0, 5);
  });

  function resetFormFields() {
    fields["drinkItemId"]?.set("");
    fields["quantityDelta"]?.set(0);
    fields["nrBottlesDelta"]?.set(0);
  }

  function selectProduct(product: DrinkItem) {
    selectedProduct = product;
    searchQuery = `${product.name} (${(product.price / 100).toFixed(2)} kr)`;
    fields["drinkItemId"]?.set(product.id);
    fields["type"]?.set(activeTab);
    fields["date"]?.set(dayjs().format("YYYY-MM-DD"));
    fields["quantityDelta"]?.set(0);
    fields["nrBottlesDelta"]?.set(0);
  }

  function handleTabChange(tab: "IN" | "OUT") {
    activeTab = tab;
    fields["type"]?.set(tab);
    searchQuery = "";
    selectedProduct = null;
    resetFormFields();
  }
</script>

<div class="mx-auto mt-4 max-w-2xl font-sans">
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-xl">Skriv in/ut</Card.Title>
    </Card.Header>
    <Card.Content>
      <Tabs.Root value="IN" class="w-full">
        <Tabs.List class="mb-6 grid w-full grid-cols-2">
          <Tabs.Trigger value="IN" onclick={() => handleTabChange("IN")}>
            Skriv in (Lagerintag)
          </Tabs.Trigger>
          <Tabs.Trigger value="OUT" onclick={() => handleTabChange("OUT")}>
            Skriv ut (Lageruttag)
          </Tabs.Trigger>
        </Tabs.List>

        <form
          class="flex flex-col gap-4"
          oninput={() => createStockchange.validate()}
          {...enhanceWithToast(createStockchange, async (f) => {
            await f.submit();
            selectedProduct = null;
            searchQuery = "";
            resetFormFields();
            getProducts().refresh();
          })}
        >
          <!-- Product Search -->
          <div class="relative flex flex-col gap-1.5">
            <Label>Sök efter produkt</Label>
            <div class="relative">
              <Search
                class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4"
              />
              <Input
                type="search"
                placeholder="Sök efter produkt..."
                class="pl-9"
                bind:value={searchQuery}
                onfocus={() => {
                  if (selectedProduct) {
                    searchQuery = "";
                    selectedProduct = null;
                  }
                }}
              />
            </div>

            {#if matches.length > 0}
              <div
                class="bg-popover text-popover-foreground absolute z-10 mt-18 w-full overflow-hidden rounded-md border shadow-md"
              >
                {#each matches as product (product.id)}
                  <button
                    type="button"
                    class="hover:bg-muted w-full px-4 py-2 text-left text-sm font-medium transition-colors"
                    onclick={() => selectProduct(product)}
                  >
                    {product.name} ({product.systembolagetID})
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          {#if selectedProduct}
            <!-- Hidden Fields -->
            <Input type="hidden" {...fields["drinkItemId"]?.as("text")} />
            <Input type="hidden" {...fields["type"]?.as("text")} />

            <!-- Info block -->
            <div
              class="bg-muted/50 flex flex-col gap-1 rounded-md border p-3 text-sm"
            >
              <div>
                <span class="text-muted-foreground">Tillgängligt:</span>
                <span class="ml-1 font-semibold">
                  {#if selectedProduct.quantityType === "COUNTS"}
                    {selectedProduct.quantityAvailable} st
                  {:else}
                    {selectedProduct.quantityAvailable} g ({selectedProduct.nrBottles}
                    fl)
                  {/if}
                </span>
              </div>
            </div>

            <!-- Deltas inputs -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <Label for="quantity-delta">
                  {selectedProduct.quantityType === "COUNTS"
                    ? "Antal st"
                    : "Totalvikt i gram"}
                </Label>
                <Input
                  id="quantity-delta"
                  placeholder="0"
                  {...fields["quantityDelta"]?.as("number")}
                />
              </div>

              {#if selectedProduct.quantityType === "WEIGHT"}
                <div class="flex flex-col gap-1.5">
                  <Label for="bottles-delta">Antal flaskor</Label>
                  <Input
                    id="bottles-delta"
                    placeholder="0"
                    {...fields["nrBottlesDelta"]?.as("number")}
                  />
                </div>
              {/if}
            </div>

            <!-- Date Picker -->
            <div class="flex flex-col gap-1.5">
              <Label>Datum</Label>
              <DatePicker
                bind:value={() => fields["date"]?.value() ?? "",
                (v) => fields["date"]?.set(v ?? "")}
                iso
              />
            </div>

            <Button
              type="submit"
              class="mt-4"
              disabled={createStockchange.pending > 0}
            >
              {#if createStockchange.pending > 0}
                <Spinner class="mr-2" />
              {/if}
              Spara
            </Button>
          {/if}
        </form>
      </Tabs.Root>
    </Card.Content>
  </Card.Root>
</div>
