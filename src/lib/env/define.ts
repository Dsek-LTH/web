export type EnvVar = {
  /** The server refuses to start without this variable. */
  required?: true;
  /** Used when the variable is unset or empty. */
  default?: string;
  /** What stops working without this variable. Logged at startup if unset. */
  feature?: string;
};

export type EnvSpec = Record<string, EnvVar>;

/** Every variable is a string. Unset optional variables are `""`. */
export type Env<S extends EnvSpec> = { readonly [K in keyof S]: string };

/**
 * Creates an object exposing the variables in `spec`. Values are read on access
 * rather than copied, because SvelteKit only populates `$env/dynamic/*` once the
 * server is initialized, which can be after a module using them is first loaded.
 */
export function defineEnv<S extends EnvSpec>(
  spec: S,
  read: (name: keyof S & string) => string | undefined,
): Env<S> {
  const env = {} as Env<S>;
  for (const key of Object.keys(spec)) {
    const name = key as keyof S & string;
    const fallback = spec[name]?.default;
    Object.defineProperty(env, name, {
      enumerable: true,
      // `||`, because an empty value means unset: `.env` has `KEY=` placeholders
      get: () => read(name) || fallback || "",
    });
  }
  return env;
}

/** Finds required variables that are unset, and features that are turned off. */
export function checkEnv<S extends EnvSpec>(spec: S, env: Env<S>) {
  const missing: string[] = [];
  const disabled = new Map<string, string[]>();
  for (const [name, { required, feature }] of Object.entries(spec)) {
    if (env[name]) continue;
    if (required) missing.push(name);
    if (feature)
      disabled.set(feature, [...(disabled.get(feature) ?? []), name]);
  }
  return { missing, disabled };
}
