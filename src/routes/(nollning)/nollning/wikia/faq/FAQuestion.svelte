<script lang="ts">
  interface Props {
    title: string;
    body: string;
    default?: boolean;
  }

  let { title, body, default: _default = false }: Props = $props();
</script>

<div
  class="collapse collapse-arrow rounded-btn border-2 border-base-200 bg-base-200 bg-transparent transition-all duration-300 ease-out has-[input:checked]:border-base-content has-[input:checked]:transition-none"
>
  <input type="radio" name="nolla-faq-accordion" checked={_default} />
  <div class="collapse-title flex justify-between">
    <span class="nolla-list-item">{title}</span>
  </div>
  <div class="collapse-content">
    <p>{body}</p>
  </div>
</div>
