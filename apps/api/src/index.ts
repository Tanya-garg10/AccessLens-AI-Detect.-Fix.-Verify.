import { buildApp, gracefulShutdown } from "./app.js";
import { env } from "./env.js";

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`AccessLens API listening on http://0.0.0.0:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

const handleExit = async (signal: string) => {
  app.log.info(`Received ${signal}, initiating graceful shutdown...`);
  await gracefulShutdown(app);
  process.exit(0);
};

process.on("SIGINT", () => void handleExit("SIGINT"));
process.on("SIGTERM", () => void handleExit("SIGTERM"));

void start();
