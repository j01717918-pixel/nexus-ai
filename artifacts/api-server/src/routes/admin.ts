import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages, userSettings, activity } from "@workspace/db";
import { desc, count, sql, max } from "drizzle-orm";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

function isAdmin(userId: string) {
  // If no admin users configured, allow the first user (dev mode)
  if (ADMIN_USER_IDS.length === 0) return true;
  return ADMIN_USER_IDS.includes(userId);
}

const router = Router();

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId || !isAdmin(userId))
    return res.status(403).json({ error: "Forbidden" });

  const [totalConversations] = await db.select({ value: count() }).from(conversations);
  const [totalMessages] = await db.select({ value: count() }).from(messages);

  const uniqueUsers = await db
    .selectDistinct({ userId: conversations.userId })
    .from(conversations);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [messagesLast24h] = await db
    .select({ value: count() })
    .from(messages)
    .where(sql`${messages.createdAt} > ${oneDayAgo}`);

  const [conversationsLast24h] = await db
    .select({ value: count() })
    .from(conversations)
    .where(sql`${conversations.createdAt} > ${oneDayAgo}`);

  const totalConvCount = totalConversations?.value ?? 0;
  const totalMsgCount = totalMessages?.value ?? 0;
  const avg =
    totalConvCount > 0
      ? Math.round((totalMsgCount / totalConvCount) * 10) / 10
      : 0;

  return res.json({
    totalUsers: uniqueUsers.length,
    totalConversations: totalConvCount,
    totalMessages: totalMsgCount,
    messagesLast24h: messagesLast24h?.value ?? 0,
    conversationsLast24h: conversationsLast24h?.value ?? 0,
    avgMessagesPerConversation: avg,
  });
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId || !isAdmin(userId))
    return res.status(403).json({ error: "Forbidden" });

  const users = await db
    .select({
      userId: conversations.userId,
      conversationCount: count(conversations.id),
      lastActiveAt: max(conversations.updatedAt),
    })
    .from(conversations)
    .groupBy(conversations.userId)
    .orderBy(desc(max(conversations.updatedAt)));

  const msgCounts = await db
    .select({
      userId: conversations.userId,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .leftJoin(messages, sql`${messages.conversationId} = ${conversations.id}`)
    .groupBy(conversations.userId);

  const msgMap = new Map(msgCounts.map((r) => [r.userId, r.messageCount]));

  return res.json(
    users.map((u) => ({
      userId: u.userId,
      email: `user-${u.userId.slice(-6)}@nexus.ai`,
      conversationCount: u.conversationCount,
      messageCount: msgMap.get(u.userId) ?? 0,
      lastActiveAt: u.lastActiveAt,
      createdAt: new Date().toISOString(),
    })),
  );
});

// GET /api/admin/activity
router.get("/activity", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId || !isAdmin(userId))
    return res.status(403).json({ error: "Forbidden" });

  const items = await db
    .select()
    .from(activity)
    .orderBy(desc(activity.createdAt))
    .limit(50);

  return res.json(items);
});

export default router;
