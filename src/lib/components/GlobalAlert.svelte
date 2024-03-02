<script lang="ts">
  //databasen tre columner, id: int, comment: string, commentEn: string, severity: string

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

<div role="alert" class={`alert alert-${severity} rounded-none`}>
  <span class={`${icon} text-xl`} />
  <span class="font-bold">{message}</span>
</div>
