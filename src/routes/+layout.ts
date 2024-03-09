// Speed Insights with SvelteKit on Vercel:
// Enables you to track traffic performance metrics, such as First Contentful Paint, or First Input Delay
// Enables you to view performance metrics by page name and URL for more granular analysis
// Shows you a score for your app's performance on each recorded metric, which you can use to track improvements or regressions
// https://vercel.com/docs/speed-insights

import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";

injectSpeedInsights();
