import type { Index, EnqueuedTask } from "meilisearch";
import { meilisearch } from "./meilisearch";
import type { MeilisearchConstants } from "./searchTypes";

/**
 * Waits for a task to finish.
 * Defaults to a timeout of 60 seconds.
 */
export async function waitForTask(
  fn: () => Promise<EnqueuedTask>,
  taskName: string,
  timeOutMs = 60 * 1000,
) {
  const currentTime = Date.now();
  console.log(`Meilisearch: Waiting for "${taskName}" to finish`);
  const enqueued = await fn();
  const taskUid = enqueued.taskUid;
  return await meilisearch
    .waitForTask(taskUid, { timeOutMs })
    .then((task) => {
      console.log(
        `Meilisearch: "${taskName}" finished in ${Date.now() - currentTime} ms`,
      );
      return task;
    })
    .catch((e) => {
      console.log(
        `Meilisearch: "${taskName}" failed after ${Date.now() - currentTime} ms`,
        e,
      );
      return e as Error;
    });
}

/**
 * Adds data to the index.
 */
export async function addDataToIndex(
  index: Index,
  data: Array<MeilisearchConstants["data"]>,
) {
  await waitForTask(
    () => index.addDocuments(data, { primaryKey: "id" }),
    `Adding documents to ${index.uid}`,
  );
}

/**
 * Removes all documents and resets all settings.
 */
export async function resetIndex(
  index: Index,
  constants: MeilisearchConstants["constants"],
) {
  await waitForTask(
    () => index.deleteAllDocuments(),
    `Deleting all documents in ${index.uid}`,
  );
  await waitForTask(
    () => index.resetSearchableAttributes(),
    `Resetting searchable attributes in ${index.uid}`,
  );
  await waitForTask(
    () => index.resetRankingRules(),
    `Resetting ranking rules in ${index.uid}`,
  );
  const sortableAttributes = constants.sortableAttributes;
  if (sortableAttributes?.length) {
    await waitForTask(
      () => index.resetSortableAttributes(),
      `Resetting sortable attributes in ${index.uid}`,
    );
  }
  const typoTolerance = constants.typoTolerance;
  if (typoTolerance !== undefined) {
    await waitForTask(
      () => index.resetTypoTolerance(),
      `Resetting typo tolerance in ${index.uid}`,
    );
  }
}

/**
 * Tweaks the settings of the index.
 */
export async function setRulesForIndex(
  index: Index,
  constants: MeilisearchConstants["constants"],
) {
  await waitForTask(
    () => index.updateSearchableAttributes(constants.searchableAttributes),
    `Updating searchable attributes in ${index.uid}`,
  );
  await waitForTask(
    () => index.updateRankingRules(constants.rankingRules),
    `Updating ranking rules in ${index.uid}`,
  );
  const sortableAttributes = constants.sortableAttributes;
  if (sortableAttributes?.length) {
    await waitForTask(
      () => index.updateSortableAttributes(sortableAttributes),
      `Updating sortable attributes in ${index.uid}`,
    );
  }
  const typoTolerance = constants.typoTolerance;
  if (typoTolerance !== undefined) {
    await waitForTask(
      () => index.updateTypoTolerance(typoTolerance),
      `Updating typo tolerance in ${index.uid}`,
    );
  }
}
