<script lang="ts">
  interface Props {
    totalInventoryValue?: number;
    showDateInput?: boolean;
    dateValue?: string;
    onDateChange?: (date: string) => void;
  }

  let { totalInventoryValue, showDateInput, dateValue, onDateChange }: Props =
    $props();
</script>

<div class="flex items-center justify-between">
  <div>
    <ul class="list-none">
      <a href="/admin/stocklist" class="mr-4">
        <button class="btn btn-primary"> Överblick </button>
      </a>
      <a href="/admin/stocklist/addproduct" class="mr-4">
        <button class="btn btn-primary"> Lägg till produkt </button>
      </a>
      <a href="/admin/stocklist/stockchange" class="mr-4">
        <button class="btn btn-primary"> Skriv in/ut </button>
      </a>
      <a href="/admin/stocklist/treasury" class="mr-4">
        <button class="btn btn-primary"> Action Logs </button>
      </a>
      <a href="/admin/stocklist/showproducts" class="mr-4">
        <button class="btn btn-primary"> Show Products </button>
      </a>
    </ul>
    {#if showDateInput && dateValue !== undefined && onDateChange}
      <input
        type="date"
        class="input input-bordered mt-2.5 border-primary"
        value={dateValue}
        oninput={(e) => onDateChange?.(e.currentTarget.value)}
      />
    {/if}
  </div>
  {#if totalInventoryValue !== undefined}
    <h1 class="text-lg">
      Totalt lagervärde: {totalInventoryValue / 100} kr
    </h1>
  {/if}
</div>
