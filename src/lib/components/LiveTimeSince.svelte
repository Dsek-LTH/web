<!--
  @component
  This component should be used to display how long 
  it's been since something has been posted, such as notifications. 
  If it has been long enough time, it will show the date instead. 
  This will also periodically update the time for the client every second.
-->

<!--This part of the code runs globally for all components of this kind.-->
<script lang="ts" module>
  type Callback = (time: number) => void;

  const synchronizedIntervals = {
    // Keeps track of all callbacks
    callbacks: [] as Callback[],
    // Interval being ran at the moment
    interval: null as ReturnType<typeof setInterval> | null,
    add: (callback: Callback) => {
      synchronizedIntervals.callbacks.push(callback);
      // If no interval tracking, start tracking intervals of 1 sec
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
      // If there are no more callbacks, clear interval tracking
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

  interface Props {
    timeStamp: number;
  }

  let { timeStamp }: Props = $props();

  let now = $state(Date.now());
  // When component is mounted, add this to be periodically updated
  onMount(() => {
    const remove = synchronizedIntervals.add((time) => {
      now = time;
    });
    return () => {
      remove();
    };
  });
  // Returns date format if it's been a week or more.
  let time = $derived(
    dayjs(timeStamp).diff(dayjs(), "week") < -1
      ? dayjs(timeStamp).format("YYYY-MM-DD")
      : dayjs(timeStamp).from(now),
  );
</script>

{time}
