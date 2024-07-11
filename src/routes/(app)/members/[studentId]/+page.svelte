<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { getFullName } from "$lib/utils/client/member";
  import ProfilePage from "./ProfilePage.svelte";
  export let data;
</script>

<SetPageTitle title={data.member ? getFullName(data.member) : "Medlem"} />

<ProfilePage {data} />
