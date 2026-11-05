/**
 * Creates a debounced function that delays invoking the provided function
 * until after `delay` milliseconds have elapsed since the last time the debounced
 * function was invoked.
 *
 * The debounced function comes with `.cancel()` and `.flush()` methods.
 * - `.cancel()` cancels any pending invocation.
 * - `.flush()` immediately invokes any pending execution.
 *
 * @template Args - The types of the arguments of the function to debounce.
 * @param fn - The function to debounce.
 * @param delay - The number of milliseconds to delay.
 * @returns The debounced function with cancel and flush capabilities.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  delay: number,
): ((...args: Args) => void) & { cancel: () => void; flush: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;

  const debounced = (...args: Args) => {
    lastArgs = args;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
      timeout = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}
