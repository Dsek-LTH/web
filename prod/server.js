// eslint-disable-next-line no-restricted-imports -- In this case instance we have no choice but to import the handler from the build directory.
import { handler } from "../build/handler.js";
import polka from "polka";

const app = polka();

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
