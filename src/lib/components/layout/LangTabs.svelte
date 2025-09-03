<script lang="ts">
  import { twMerge } from "tailwind-merge";

  export let activeTab: "sv" | "en" = "sv";
  let clazz: string | undefined = undefined;
  export { clazz as class };
</script>

<div
  role="tablist"
  class={twMerge(
    "tabs-box tabs relative -mx-4 overflow-hidden p-4 shadow-sm",
    clazz,
  )}
>
  <input
    type="radio"
    name="tabs"
    role="tab"
    class="tab px-8"
    aria-label="SV"
    value="sv"
    checked
    bind:group={activeTab}
  />
  <div role="tabpanel" class="tab-content">
    <slot name="sv" />
  </div>
  <input
    type="radio"
    name="tabs"
    role="tab"
    class="tab px-8"
    aria-label="EN"
    value="en"
    bind:group={activeTab}
  />
  <div role="tabpanel" class="tab-content">
    <slot name="en" />
  </div>
</div>
