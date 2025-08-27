<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
  import dayjs from "dayjs";
  export let data: PageData;
</script>

<NotImplemented />
