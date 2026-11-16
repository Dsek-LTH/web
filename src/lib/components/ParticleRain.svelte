<script lang="ts">
  import { onMount } from "svelte";

  type Props = {
    count?: number;
    colors?: string[];
    content?: string;
    minSize?: number;
    maxSize?: number;
    minDuration?: number;
    maxDuration?: number;
    drift?: number;
    opacity?: number;
    shape?: "rect" | "circle";
  };

  let {
    count = 60,
    colors = ["#f280a1", "#9966cc", "#ffd166", "#7dd3fc", "#86efac"],
    content,
    minSize = 5,
    maxSize = 11,
    minDuration = 6,
    maxDuration = 12,
    drift = 120,
    opacity = 0.8,
    shape = "rect",
  }: Props = $props();

  type Piece = {
    left: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    drift: number;
    rotation: number;
  };

  let pieces = $state<Piece[]>([]);

  onMount(() => {
    pieces = Array.from({ length: count }, (_, i) => {
      const duration =
        minDuration + Math.random() * (maxDuration - minDuration);
      return {
        left: Math.random() * 100,
        delay: -Math.random() * duration,
        duration,
        size: minSize + Math.random() * (maxSize - minSize),
        color: colors[i % colors.length]!,
        drift: (Math.random() - 0.5) * drift,
        rotation: 360 + Math.random() * 720,
      };
    });
  });
</script>

<div
  class="pointer-events-none fixed inset-0 z-40 overflow-hidden"
  aria-hidden="true"
>
  {#each pieces as piece, i (i)}
    <span
      class="particle"
      style:left="{piece.left}%"
      style:width="{piece.size}px"
      style:height="{content ? piece.size : piece.size * 1.6}px"
      style:background={content ? "transparent" : piece.color}
      style:color={piece.color}
      style:font-size="{piece.size}px"
      style:border-radius={content
        ? undefined
        : shape === "circle"
          ? "50%"
          : "2px"}
      style:opacity
      style="--duration: {piece.duration}s; --delay: {piece.delay}s; --drift: {piece.drift}px; --rotation: {piece.rotation}deg"
      >{content}</span
    >
  {/each}
</div>

<style>
  .particle {
    position: absolute;
    top: -10vh;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    animation: particle-fall var(--duration) linear var(--delay) infinite;
  }

  @keyframes particle-fall {
    to {
      transform: translate3d(var(--drift), 120vh, 0) rotate(var(--rotation));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .particle {
      display: none;
    }
  }
</style>
