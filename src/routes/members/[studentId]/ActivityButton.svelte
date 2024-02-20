<script lang="ts">
  export let title: string;
  export let rightAdornment: string;
  export let link: string;
</script>

<a
  href={link}
  class="btn grid grid-cols-[1fr_auto] justify-between normal-case"
>
  <h1
    class="overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium"
  >
    {title}
  </h1>
  <div>
    <span class="text-xs font-bold opacity-50">
      {rightAdornment}
    </span>
  </div>
</a>
