import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY must be set. Get a free key at https://aistudio.google.com/apikey",
  );
}

if (apiKey.startsWith("AQ.")) {
  console.warn(
    "\n⚠  GEMINI_API_KEY looks like a Replit-managed token and will NOT work locally.\n" +
      "   Get a free Google AI Studio key at https://aistudio.google.com/apikey\n" +
      "   and set it as GEMINI_API_KEY in your .env file.\n",
  );
}

export const ai = new GoogleGenAI({ apiKey });

/** Returns null if the key works, or an error message if not. */
export async function validateGeminiKey(): Promise<string | null> {
  try {
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      config: { maxOutputTokens: 1 },
    });
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401") || msg.includes("invalid authentication")) {
      return (
        "Gemini API key is invalid. Get a free key at https://aistudio.google.com/apikey " +
        "and set GEMINI_API_KEY in .env, then restart the API server."
      );
    }
    return `Gemini API error: ${msg.slice(0, 200)}`;
  }
}
