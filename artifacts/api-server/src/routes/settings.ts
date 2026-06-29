import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userSettings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

// GET /api/settings
router.get("/", async (req, res) => {
  const auth = getAuth(req);
  console.log("Settings route auth check:", {
    authHeader: req.headers.authorization ? "Present" : "Missing",
    tokenPreview: req.headers.authorization ? req.headers.authorization.substring(0, 20) + "..." : null,
    authObj: auth,
  });
  const { userId } = auth;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  let [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (!settings) {
    [settings] = await db
      .insert(userSettings)
      .values({ userId })
      .returning();
  }

  return res.json(settings);
});

// PUT /api/settings
router.put("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = UpdateSettingsBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid request" });

  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  let settings;
  if (existing) {
    [settings] = await db
      .update(userSettings)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
  } else {
    [settings] = await db
      .insert(userSettings)
      .values({ userId, ...body.data })
      .returning();
  }

  return res.json(settings);
});

export default router;
