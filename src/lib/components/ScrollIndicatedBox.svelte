<script lang="ts">
  export let element: HTMLElement;
  $: (() => {
    if (element && element.onscroll == null) {
      element.onscroll = () => {
        element = element; // for reactivity
      };
    }
  })();
</script>

<div class="relative">
  <slot />
  <div
    class="arrow-indicator pointer-events-none absolute right-1/2 top-2 translate-x-1/2 rounded-md bg-primary/40 px-2 text-xl transition-opacity {element &&
    element.scrollTop > 20
      ? 'opacity-100'
      : 'opacity-0'}"
  >
    ↑
  </div>
  <div
    class="arrow-indicator pointer-events-none absolute bottom-2 right-1/2 translate-x-1/2 rounded-md bg-primary/40 px-2 text-xl transition-opacity {element &&
    element.scrollHeight > element.clientHeight &&
    element.scrollTop + element.clientHeight < element.scrollHeight - 20
      ? 'opacity-100'
      : 'opacity-0'}"
  >
    ↓
  </div>
</div>
