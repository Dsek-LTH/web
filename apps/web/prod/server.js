// We can't go through build/index.js, which adds the instrumentation but also
// starts adapter-node's own server. So do what it does: load the instrumentation
// first and everything else dynamically, since static imports would be resolved
// before the instrumentation's hooks are registered and wouldn't get traced.
// eslint-disable-next-line no-restricted-imports -- In this case instance we have no choice but to import from the build directory.
import "../build/server/instrumentation.server.js";

const { handler } = await import("../build/handler.js");
const { default: express } = await import("express");

const app = express();

if (process.env["REQUEST_LOGGING"] === "true") {
  // Logging middleware
  app.use((req, res, next) => {
    const startTime = Date.now();

    // Capture response finish event to log details
    res.on("finish", () => {
      const duration = Date.now() - startTime;

      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Response Time: ${duration}ms | User-Agent: ${req.headers["user-agent"]}`,
      );
    });

    next();
  });
}

app.use(handler);

app.listen(process.env.PORT);
