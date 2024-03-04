<script lang="ts" context="module">
  // This is only ran ONCE, on first component load, instead of on every component load
  // This makes sure every live time updates synchronously, and not every xsecond independently
  type Callback = (time: number) => void;

  const synchronizedIntervals = {
    callbacks: [] as Callback[],
    interval: null as ReturnType<typeof setInterval> | null,
    add: (callback: Callback) => {
      synchronizedIntervals.callbacks.push(callback);
      if (synchronizedIntervals.interval === null) {
        synchronizedIntervals.interval = setInterval(() => {
          const time = Date.now();
          synchronizedIntervals.callbacks.forEach((c) => c(time));
        }, 1000);
      }
      return () => {
        synchronizedIntervals.remove(callback);
      };
    },
    remove: (callback: Callback) => {
      synchronizedIntervals.callbacks = synchronizedIntervals.callbacks.filter(
        (c) => c !== callback,
      );
      if (
        synchronizedIntervals.callbacks.length === 0 &&
        synchronizedIntervals.interval
      ) {
        clearInterval(synchronizedIntervals.interval!);
        synchronizedIntervals.interval = null;
      }
    },
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";

  export let timeStamp: number;

  let now = Date.now() / 1000;
  onMount(() => {
    const remove = synchronizedIntervals.add((time) => {
      now = time / 1000;
    });
    return () => {
      remove();
    };
  });
  // Gets hours, minutes and seconds and then returns hour, if it's been at least 59 minutes,
  // returns seconds if it's been less than a minute, and else minutes
  $: time = (() => {
    const seconds = Math.floor(now - timeStamp / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return hours > 23
      ? (hours % 24) + " dagar"
      : minutes < 1 && hours < 1
        ? seconds + " sekunder"
        : hours < 1
          ? minutes + " minuter"
          : hours + " timmar";
  })();
</script>

{time} sedan
