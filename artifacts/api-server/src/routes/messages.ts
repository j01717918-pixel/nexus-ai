import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { messages, feedback } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitFeedbackParams, SubmitFeedbackBody } from "@workspace/api-zod";

const router = Router();

// POST /api/messages/:id/feedback
router.post("/:id/feedback", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = SubmitFeedbackParams.safeParse({ id: Number(req.params.id) });
  const body = SubmitFeedbackBody.safeParse(req.body);
  if (!params.success || !body.success)
    return res.status(400).json({ error: "Invalid request" });

  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, params.data.id));
  if (!msg) return res.status(404).json({ error: "Message not found" });

  // Update message rating
  await db
    .update(messages)
    .set({ rating: body.data.rating })
    .where(eq(messages.id, params.data.id));

  const [fb] = await db
    .insert(feedback)
    .values({
      messageId: params.data.id,
      userId,
      rating: body.data.rating,
      comment: body.data.comment ?? null,
    })
    .returning();

  return res.status(201).json(fb);
});

export default router;
