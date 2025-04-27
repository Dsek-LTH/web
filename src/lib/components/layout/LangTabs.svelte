<script lang="ts">
  import { twMerge } from "tailwind-merge";

  interface Props {
    activeTab?: "sv" | "en";
    class?: string | undefined;
    sv?: import("svelte").Snippet;
    en?: import("svelte").Snippet;
  }

  let {
    activeTab = $bindable("sv"),
    class: clazz = undefined,
    sv,
    en,
  }: Props = $props();
</script>

<div
  role="tablist"
  class={twMerge(
    "tabs-boxed tabs relative -mx-4 overflow-hidden p-4 shadow",
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
    {@render sv?.()}
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
    {@render en?.()}
  </div>
</div>
