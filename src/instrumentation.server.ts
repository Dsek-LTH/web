import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { createAddHookMessageChannel } from "import-in-the-middle";
import { register } from "module";
import { env } from "$env/dynamic/public";

const { registerOptions } = createAddHookMessageChannel();
// registerOptions has a shape incompatible with current types; cast to any
register(
  "import-in-the-middle/hook.mjs",
  import.meta.url,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOptions as any,
);

const sdk = new NodeSDK({
  serviceName: "dsek.se",
  traceExporter: new OTLPTraceExporter({
    url: env.PUBLIC_OTLP_TRACE_EXPORT_URL,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
