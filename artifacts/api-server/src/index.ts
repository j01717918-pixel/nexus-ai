import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app";
import { validateGeminiKey } from "@workspace/integrations-gemini-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../../.env");

console.log("Loading ENV from:", envPath);

dotenv.config({
  path: envPath,
});

const port = Number(process.env.PORT || 8080);

app.listen(port, async () => {
  console.log(`API server listening on port ${port}`);

  const geminiError = await validateGeminiKey();
  if (geminiError) {
    console.error(`\n✗ ${geminiError}\n`);
  } else {
    console.log("✓ Gemini API key validated");
  }
});