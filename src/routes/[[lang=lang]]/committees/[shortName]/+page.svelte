<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import PositionGrid from "../PositionGrid.svelte";
  import EditCommitteeForm from "../EditCommitteeForm.svelte";
  import CommitteeHeader from "../CommitteeHeader.svelte";

  export let data;
  let isEditing = false;
</script>

<CommitteeHeader
  committee={data.committee}
  accessPolicies={data.accessPolicies}
  uniqueMemberCount={data.uniqueMemberCount}
  numberOfMandates={data.numberOfMandates}
  editing={isEditing}
  toggleEditing={() => (isEditing = !isEditing)}
/>

<EditCommitteeForm
  form={data.form}
  open={isEditing}
  accessPolicies={data.accessPolicies}
/>

{#if data.markdown?.markdown}
  <MarkdownBody body={data.markdown.markdown} />
{/if}

<PositionGrid positions={data.positions} />
