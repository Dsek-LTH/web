<script lang="ts">
  import { beforeNavigate } from "$app/navigation";

  let lastPathname: string | null = null;

  beforeNavigate(({ from, to }) => {
    if (from?.url && to?.url) {
      lastPathname = from.url.pathname;
      sessionStorage.setItem("lastPathname", lastPathname);
    }
  });
</script>

<div class="layout-container">
  <slot />
</div>
