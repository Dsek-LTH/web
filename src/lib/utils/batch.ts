/**
 * Same as Promise.all(items.map(item => task(item))), but it waits for
 * the first {batchSize} promises to finish before starting the next batch.
 *
 * @param items Arguments to pass to the task for each call.
 * @param task The asynchronous task to run for each item.
 * @param batchSize
 */
export async function promiseAllInBatches<A, B>(
  items: A[],
  task: (item: A) => Promise<B>,
  batchSize: number,
): Promise<B[]> {
  let position = 0;
  let results: B[] = [];
  while (position < items.length) {
    const itemsForBatch: A[] = items.slice(position, position + batchSize);
    const promises: Array<Promise<B>> = itemsForBatch.map((item: A) =>
      task(item)
    );
    results = [...results, ...(await Promise.all(promises))];
    position += batchSize;
  }
  return results;
}
