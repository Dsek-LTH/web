# Feature flags

When working on larger features we want to avoid long lived branches with a lot of changes. This can be avoided by hiding the feature behind a feature flag.

1. Add your flag to the array `featureFlags` in `src/lib/utils/featureFlag.ts`.

2. Go to the relevant component/page and add

```typescript
let isEnabled = false;
onMount(() => {
  isEnabled = isFeatureFlagEnabled("newFeature");
});
```

3. Go to `/admin/debug` to toggle the feature flag

4. Use

```svelte
{#if isEnabled}
  Awesome new feature goes here
{/if}
```

in the relevant component/page to hide your feature until it's ready.
