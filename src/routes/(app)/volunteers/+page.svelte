<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import * as m from "$paraglide/messages";
  import type { PageData } from "./$types";
</script>

<PageHeader title={m.volunteers()} />
<div class="">
  <a class="btn" href="/volunteers/access">Access</a>
  <a class="btn" href="/info/benefits">Förmåner som funkis/</a>
  <a class="btn" href="/volunteers/access">Bokningar och Sektionsmöten</a>
</div>
