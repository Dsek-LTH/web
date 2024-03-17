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
  import dayjs from "dayjs";

  export let timeStamp: number;

  let now = Date.now();
  onMount(() => {
    const remove = synchronizedIntervals.add((time) => {
      now = time;
    });
    return () => {
      remove();
    };
  });
  // Gets hours, minutes and seconds and then returns hour, if it's been at least 59 minutes,
  // returns seconds if it's been less than a minute, and else minutes
  $: time =
    dayjs(timeStamp).diff(dayjs(), "week") < -1
      ? dayjs(timeStamp).format("YYYY-MM-DD")
      : dayjs(timeStamp).from(now);
</script>

{time}
