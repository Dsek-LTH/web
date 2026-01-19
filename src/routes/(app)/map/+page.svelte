<script lang="ts">
  import cellar from "./images/cellar.svg";
  import floor1 from "./images/floor1.svg";
  import floor2 from "./images/floor2.svg";
  import floor3 from "./images/floor3.svg";
  import floor4 from "./images/floor4.svg";
  import { page } from "$app/stores";
  import Tabs from "./Tabs.svelte";

  let type: string = "floor-1";
  const floorOptions = [
    { name: "Basement", value: "basement" },
    { name: "Floor 1", value: "floor-1" },
    { name: "Floor 2", value: "floor-2" },
    { name: "Floor 3", value: "floor-3" },
    { name: "Floor 4", value: "floor-4" },
    { name: "Floor 5", value: "floor-5" },
  ];

  $: type = $page.url.searchParams.get("type") ?? type;

  $: if (type) {
    const url = new URL(window.location.href);
    url.searchParams.set("type", type);
    history.replaceState({}, "", url);
  }

  $: currentFloorName = floorOptions.find((o) => o.value === type)?.name ?? "";
</script>

<!-- Begin actual bread -->
<div class="px-52">
  <Tabs options={floorOptions} bind:currentTab={type} />
  <div>
    <h2 class="mt-4 text-2xl font-bold">{currentFloorName}</h2>
    <div class="grid grid-cols-2">
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img class="w-5/8" src={cellar} alt="picture" />
      <div class="px-10">
        <h3>Hej</h3>
      </div>
    </div>
  </div>
</div>
