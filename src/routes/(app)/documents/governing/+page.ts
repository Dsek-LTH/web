import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import { getYearOrThrowSvelteError } from "$lib/utils/url";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, url }) => {
  const year = getYearOrThrowSvelteError(url);
  const res = await api.GET("/governing-documents", { fetch });
  if (res.error) throw error(500, "Failed to load governing documents");
  const documents = res.data ?? [];

  const filterDocuments = (type: string, filterByDate: boolean) =>
    documents.filter(
      (document) =>
        document.type === type &&
        (filterByDate
          ? new Date(document.createdAt).getFullYear() == year
          : true),
    );

  return {
    policies: filterDocuments("POLICY", false),
    guidelines: filterDocuments("GUIDELINE", false),
    plansOfOperations: filterDocuments("PLAN_OF_OPERATIONS", true),
    frameworkBudgets: filterDocuments("FRAMEWORK_BUDGET", true),
    strategicGoals: filterDocuments("STRATEGIC_GOALS", true),
  };
};
