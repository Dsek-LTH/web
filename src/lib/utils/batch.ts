/**
 * Same as Promise.all(items.map(item => task(item))), but it waits for
 * the first {batchSize} promises to finish before starting the next batch.
 *
 * @param items Arguments to pass to the task for each call.
 * @param task The task to run for each item.
 * @param batchSize
 */
export async function promiseAllInBatches<A, B>(
  items: A[],
  task: (item: A) => B,
  batchSize: number,
): Promise<B[]> {
  let position = 0;
  let results: B[] = [];
  while (position < items.length) {
    const itemsForBatch = items.slice(position, position + batchSize);
    results = [
      ...results,
      ...(await Promise.all(itemsForBatch.map((item: A) => task(item)))),
    ];
    position += batchSize;
  }
  return results;
}
