<script lang="ts">
  import { marked } from "marked";
  import DOMPurify from "isomorphic-dompurify";
  import { invalidate } from "$app/navigation";

  export let id: string;
  export let message: string;
  export let severity: string;

  const icon = (() => {
    switch (severity) {
      case "info":
        return "i-mdi-information-outline";
      case "success":
        return "i-mdi-check-circle-outline";
      case "warning":
        return "i-mdi-alert-outline";
      case "error":
        return "i-mdi-close-circle-outline";
    }
  })();
</script>

<div role="alert" class={`alert alert-${severity} rounded-none gap-1`}>
  <span class={`${icon} text-xl`}></span>
  <span class="font-bold prose-a:link">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- Sanitized client-side -->
    {@html marked(DOMPurify.sanitize(message))}
  </span>
  <form
    method="POST"
    action="/api/closeAlert"
    class="sm:h-[unset] h-7 w-20 sm:border-0 sm:w-7 border-t-[1.5px] border-black border-opacity-20"
    on:submit={(e) => {
      e.preventDefault();
      const ACTION_URL = "/api/closeAlert";
      const formData = new FormData(e.currentTarget);
      const data = new URLSearchParams();
      for (let field of formData) {
        const [key, value] = field;
        if (typeof value === "string") {
          data.append(key, value);
        }
      }
      fetch(ACTION_URL, {
        method: "POST",
        body: data,
      }).then(() => invalidate("alerts"));
    }}
  >
    <button class="aspect-square h-7 w-7 mt-1 sm:mt-0 font-black rounded-lg bg-transparent hover:bg-white/20 transition"> ✕ </button>
    <input type="hidden" name="alertId" value={id} />
  </form>
</div>
