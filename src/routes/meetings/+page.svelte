<script lang="ts">
  export let data;
</script>

<ul>
  {#each data.meetings as meeting (meeting.id)}
    <li>
      <a href="/meetings/{meeting.id}">{meeting.title}</a>
    </li>
  {/each}
</ul>
