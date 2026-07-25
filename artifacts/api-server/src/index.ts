import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import app from "./app";
import { validateGeminiKey } from "@workspace/integrations-gemini-ai";
import { ensureTablesExist } from "@workspace/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development, load local .env if present. In production (Render), rely on process.env.
if (process.env.NODE_ENV !== "production") {
  const envPath = path.resolve(__dirname, "../../../.env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const port = Number(process.env.PORT || 8080);

async function start() {
  try {
    // Do not accept requests until the database is reachable and its schema is ready.
    await ensureTablesExist();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n==================================================`);
    console.error(`FATAL STARTUP ERROR: Database check failed.`);
    console.error(msg);
    console.error(`Aborting server startup.`);
    console.error(`==================================================\n`);
    process.exit(1);
  }

  app.listen(port, async () => {
    console.log(`API server listening on port ${port}`);

    const geminiError = await validateGeminiKey();
    if (geminiError) {
      console.error(`\n✗ ${geminiError}\n`);
    } else {
      console.log("✓ Gemini API key validated");
    }
  });
}

start().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("API startup failed:", msg);
  process.exit(1);
});
