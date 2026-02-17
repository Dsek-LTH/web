<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";

  import { type IconProps } from "@lucide/svelte";

  import SuccessIcon from "@lucide/svelte/icons/check";
  import InfoIcon from "@lucide/svelte/icons/info";
  import WarningIcon from "@lucide/svelte/icons/triangle-alert";
  import ErrorIcon from "@lucide/svelte/icons/octagon-alert";

  import CloseIcon from "@lucide/svelte/icons/x";
  import type { Component } from "svelte";

  export let id: string;
  export let message: string;
  export let severity: string;

  interface SeverityData {
    icon: Component<IconProps>;
    colour: string;
  }

  let data: Record<string, SeverityData> = {
    success: { icon: SuccessIcon, colour: "bg-pistachio-400" },
    info: { icon: InfoIcon, colour: "bg-alert-info" },
    warning: { icon: WarningIcon, colour: "bg-alert-warning" },
    error: { icon: ErrorIcon, colour: "bg-alert-error" },
  };

  let { icon, colour } = data[severity]!;

  let closeAlert = () =>
    fetch("/api/closeAlert", {
      method: "POST",
      body: JSON.stringify({
        id: id,
      }),
    }).then(() => invalidate("alerts"));
</script>

<div
  class={`flex h-16 w-full flex-row items-center justify-between pr-4 pl-4 ${colour}`}
  role="alert"
>
  <svelte:component this={icon} size={40} />

  <span class="text-2xl font-bold">{message}</span>

  <Button class="text-foreground" variant="ghost" onclick={closeAlert}>
    <CloseIcon strokeWidth={5} />
  </Button>
</div>
