<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import DOMPurify from "isomorphic-dompurify";
  import { marked } from "marked";

  import { type IconProps } from "@lucide/svelte";

  import Check from "@lucide/svelte/icons/check";
  import Info from "@lucide/svelte/icons/info";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import OctagonAlert from "@lucide/svelte/icons/octagon-alert";

  import X from "@lucide/svelte/icons/x";
  import type { Component } from "svelte";

  let {
    id,
    message,
    severity,
  }: { id: string; message: string; severity: string } = $props();

  interface SeverityData {
    icon: Component<IconProps>;
    foreground: string;
    background: string;
  }

  let data: Record<string, SeverityData> = {
    success: {
      icon: Check,
      background: "bg-pistachio-background",
      foreground: "text-pistachio-foreground",
    },
    info: {
      icon: Info,
      background: "bg-alert-info-background",
      foreground: "text-alert-info-foreground",
    },
    warning: {
      icon: TriangleAlert,
      background: "bg-alert-warning-background",
      foreground: "text-alert-warning-foreground",
    },
    error: {
      icon: OctagonAlert,
      background: "bg-alert-error-background",
      foreground: "text-alert-error-foreground",
    },
  };

  let { icon, foreground, background } = $derived(data[severity])!;
  const Icon = $derived(icon);

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
    "flex flex-row items-center justify-between gap-4 px-4 py-2",
    foreground,
    background,
  )}
  role="alert"
>
  <Icon size={24} class="shrink-0" strokeWidth={3} />

  <div class="text-lg font-bold [&_a]:underline">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- Markdown is sanitized before rendering -->
    {@html DOMPurify.sanitize(marked.parse(message, { async: false }))}
  </div>

  <Button class={foreground} variant="ghost" onclick={closeAlert}>
    <X strokeWidth={5} />
  </Button>
</div>
