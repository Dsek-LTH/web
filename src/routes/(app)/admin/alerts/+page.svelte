<script lang="ts">
  export let data;

  // YYYY-MM-DD HH:MM:SS
  function formatTimestamp(timestamp: Date): string {
    return timestamp
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");
  }
</script>

<form
  method="POST"
  class="flex w-full flex-col items-center gap-2"
  action="?/create"
>
  <input
    type="text"
    name="message"
    placeholder="Meddelande Svenska"
    class="input input-bordered w-full max-w-lg"
  />
  <input
    type="text"
    name="messageEn"
    placeholder="Meddelande Engelska"
    class="input input-bordered w-full max-w-lg"
  />
  <select name="severity" class="select select-bordered w-full max-w-lg">
    <option disabled selected>Severity</option>
    <option value="info">Info</option>
    <option value="success">Success</option>
    <option value="warning">Warning</option>
    <option value="error">Error</option>
  </select>
  <button class="btn w-full max-w-lg">Skapa</button>
</form>
<div class="divider">Aktiva alerts</div>
<table class="table">
  <!-- head -->
  <thead>
    <tr>
      <th>Severity</th>
      <th>Svenska</th>
      <th>Engelska</th>
      <th>Skapad</th>
      <th>Ta bort</th>
    </tr>
  </thead>
  <tbody>
    {#each data.alert as { severity, message, messageEn, createdAt, id }}
      <tr>
        <th class="capitalize">{severity}</th>
        <td>{message}</td>
        <td>{messageEn}</td>
        <td>{formatTimestamp(createdAt)}</td>
        <td>
          <form method="POST" action="?/delete">
            <input class="hidden" type="text" name="id" value={id} />
            <button class="btn btn-square" type="submit">
              <span class="i-mdi-delete text-xl"></span>
            </button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
