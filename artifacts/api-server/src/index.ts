import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../../.env");

console.log("Loading ENV from:", envPath);

dotenv.config({
  path: envPath,
});

const port = Number(process.env.PORT || 8080);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});