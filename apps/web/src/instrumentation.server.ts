import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { createAddHookMessageChannel } from "import-in-the-middle";
import { register } from "module";

const { registerOptions } = createAddHookMessageChannel();
register(
  "import-in-the-middle/hook.mjs",
  import.meta.url,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- registerOptions has a shape incompatible with current types; cast to any
  registerOptions as any,
);

// This file runs before SvelteKit's `Server.init()`, which is what populates
// `$env/dynamic/*`, so those modules are still empty here.
const sdk = new NodeSDK({
  serviceName: process.env["PUBLIC_OTLP_SERVICE_NAME"],
  traceExporter: new OTLPTraceExporter({
    url: process.env["PUBLIC_OTLP_TRACE_EXPORT_URL"],
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
