<script lang="ts">
  import type { LayoutProps } from "./$types";
  import { CardTitle } from "$lib/components/ui/card";
  import DoorOpen from "@lucide/svelte/icons/door-open";

  let { data, children }: LayoutProps = $props();
  let doors = $derived(data.doors);
  let selectedDoor = $derived(data.slug);
</script>

<main class="layout-container">
  <h3 class="mb-3">Doors</h3>

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[auto_1fr]">
    <!-- Left column: list of doors -->
    <section>
      <div class="space-y-2">
        {#each doors as door (door.id)}
          {@const isCurrent = door.name == selectedDoor}
          <a href="/admin/doors/edit/{door.name}" class="block">
            <div
              class={{
                "rounded-lg border p-4 px-6": true,
                "ring-rosa-background ring-2": isCurrent,
                "hover:border-rosa-hover": !isCurrent,
              }}
            >
              <div class="flex items-center justify-between gap-16">
                <div>
                  <CardTitle>{door.verboseName}</CardTitle>
                </div>

                <DoorOpen />
              </div>
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- Right column: policies for chosen door -->
    <section>
      {@render children()}
    </section>
  </div>
</main>
