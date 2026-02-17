<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";

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
    foreground: string;
    background: string;
  }

  let data: Record<string, SeverityData> = {
    success: {
      icon: SuccessIcon,
      background: "bg-pistachio-background",
      foreground: "text-pistachio-foreground",
    },
    info: {
      icon: InfoIcon,
      background: "bg-alert-info-background",
      foreground: "text-alert-info-foreground",
    },
    warning: {
      icon: WarningIcon,
      background: "bg-alert-warning-background",
      foreground: "text-alert-warning-foreground",
    },
    error: {
      icon: ErrorIcon,
      background: "bg-alert-error-background",
      foreground: "text-alert-error-foreground",
    },
  };

  let { icon, foreground, background } = data[severity]!;

  let closeAlert = () =>
    fetch("/api/closeAlert", {
      method: "POST",
      body: JSON.stringify({
        id: id,
      }),
    }).then(() => invalidate("alerts"));
</script>

<div
  class={cn(
    "flex h-16 flex-row items-center justify-between pr-4 pl-4",
    foreground,
    background,
  )}
  role="alert"
>
  <svelte:component this={icon} size={24} strokeWidth={3} />

  <span class="text-2xl font-bold">{message}</span>

  <Button class={foreground} variant="ghost" onclick={closeAlert}>
    <CloseIcon strokeWidth={5} />
  </Button>
</div>
