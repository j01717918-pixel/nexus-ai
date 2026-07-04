import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  conversations,
  messages,
  activity,
} from "@workspace/db";
import { eq, desc, and, ilike, sql, count } from "drizzle-orm";
import {
  CreateConversationBody,
  UpdateConversationBody,
  GetConversationParams,
  UpdateConversationParams,
  DeleteConversationParams,
  SearchConversationsQueryParams,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

// GET /api/conversations
router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const convos = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, userId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt));

  return res.json(convos);
});

// POST /api/conversations
router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = CreateConversationBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid request" });

  const [convo] = await db
    .insert(conversations)
    .values({ userId, title: body.data.title })
    .returning();

  await db.insert(activity).values({
    type: "conversation_created",
    userId,
    description: `Created conversation: ${body.data.title}`,
  });

  return res.status(201).json({ ...convo, messageCount: 0 });
});

// GET /api/conversations/search
router.get("/search", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = SearchConversationsQueryParams.safeParse(req.query);
  if (!params.success) return res.status(400).json({ error: "Invalid query" });

  const convos = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        ilike(conversations.title, `%${params.data.q}%`),
      ),
    )
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt));

  return res.json(convos);
});

// GET /api/conversations/:id
router.get("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = GetConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [convo] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, params.data.id), eq(conversations.userId, userId)),
    );

  if (!convo) return res.status(404).json({ error: "Not found" });

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convo.id))
    .orderBy(messages.createdAt);

  return res.json({ ...convo, messageCount: msgs.length, messages: msgs });
});

// PATCH /api/conversations/:id
router.patch("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = UpdateConversationParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateConversationBody.safeParse(req.body);
  if (!params.success || !body.success)
    return res.status(400).json({ error: "Invalid request" });

  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, params.data.id), eq(conversations.userId, userId)),
    );
  if (!existing) return res.status(404).json({ error: "Not found" });

  const [updated] = await db
    .update(conversations)
    .set({ title: body.data.title, updatedAt: new Date() })
    .where(eq(conversations.id, params.data.id))
    .returning();

  const [{ messageCount }] = await db
    .select({ messageCount: count(messages.id) })
    .from(messages)
    .where(eq(messages.conversationId, params.data.id));

  return res.json({ ...updated, messageCount });
});

// DELETE /api/conversations/:id
router.delete("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = DeleteConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, params.data.id), eq(conversations.userId, userId)),
    );
  if (!existing) return res.status(404).json({ error: "Not found" });

  await db.delete(conversations).where(eq(conversations.id, params.data.id));

  return res.status(204).send();
});

// GET /api/conversations/:id/messages
router.get("/:id/messages", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

  if (!convo) return res.status(404).json({ error: "Not found" });

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  return res.json(msgs);
});

// POST /api/conversations/:id/messages (SSE streaming)
router.post("/:id/messages", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const body = req.body as { content?: string };
  if (!body.content?.trim()) return res.status(400).json({ error: "Content required" });

  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

  if (!convo) return res.status(404).json({ error: "Not found" });

  // Save user message
  await db
    .insert(messages)
    .values({ conversationId: id, role: "user", content: body.content })
    .returning();

  // Update conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id));

  // Load conversation history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant message
    await db
      .insert(messages)
      .values({ conversationId: id, role: "assistant", content: fullResponse });

    // Update conversation updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));

    // Auto-title conversation if it's the first exchange
    if (history.length === 1) {
      try {
        const titleResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate a concise 4-6 word title for this conversation. Return ONLY the title text, no quotes or punctuation:\n\nUser: ${body.content}\nAssistant: ${fullResponse.slice(0, 200)}`,
                },
              ],
            },
          ],
          config: { maxOutputTokens: 20 },
        });
        const title = titleResponse.text?.trim();
        if (title) {
          await db
            .update(conversations)
            .set({ title })
            .where(eq(conversations.id, id));
        }
      } catch {
        // Non-critical — ignore title generation errors
      }
    }

    await db.insert(activity).values({
      type: "message_sent",
      userId,
      description: `Sent message in: ${convo.title}`,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    console.error("AI generation failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    let message = "AI generation failed";
    if (errMsg.includes("401") || errMsg.includes("invalid authentication")) {
      message =
        "Invalid Gemini API key. Get a free key at https://aistudio.google.com/apikey, " +
        "set GEMINI_API_KEY in .env, and restart the API server.";
    }
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  }

  return res.end();
});

export default router;
