<script lang="ts">
  type Flake = {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
  };

  let { active = $bindable(false) } = $props();

  let flakes: Flake[] = $state([]);
  let nextId = 0;
  let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

  function trigger() {
    if (cleanupTimeout) clearTimeout(cleanupTimeout);

    const newFlakes: Flake[] = Array.from({ length: 600 }, () => ({
      id: nextId++,
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 1 + Math.random() * 2,
      size: 1.5 + Math.random() * 1,
    }));
    flakes = newFlakes; // ersätter, staplar inte på tidigare omgångar

    cleanupTimeout = setTimeout(() => {
      flakes = [];
      cleanupTimeout = null;
    }, 8000);
  }

  $effect(() => {
    if (active) {
      trigger();
      active = false;
    }
  });
</script>

<div class="pointer-events-none fixed inset-0 z-50 overflow-hidden">
  {#each flakes as flake (flake.id)}
    <span
      class="snowflake absolute top-0 text-white opacity-70"
      style="--left: {flake.left}%; --duration: {flake.duration}s; --delay: {flake.delay}s; --size: {flake.size}rem;"
    >
      ❄
    </span>
  {/each}
</div>

<style>
  .snowflake {
    left: var(--left);
    font-size: var(--size);
    animation: fall var(--duration) linear var(--delay) both;
  }

  @keyframes fall {
    from {
      transform: translateY(-10vh) rotate(0deg);
      opacity: 1;
    }
    to {
      transform: translateY(110vh) rotate(360deg);
      opacity: 0.3;
    }
  }
</style>
