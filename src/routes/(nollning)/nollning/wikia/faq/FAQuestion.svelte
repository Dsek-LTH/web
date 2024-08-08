<script lang="ts">
  export let title: string;
  export let body: string;
  export let _default = false;
  export { _default as default };
</script>

<div
  class="collapse collapse-arrow rounded-btn border-2 border-base-200 bg-base-200 bg-transparent"
>
  <input type="radio" name="nolla-faq-accordion" checked={_default} />
  <div class="collapse-title flex justify-between">
    <span class="nolla-list-item">{title}</span>
  </div>
  <div class="collapse-content">
    <p>{body}</p>
  </div>
</div>
