import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    userId: text("user_id").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_user_id_idx").on(t.userId)],
);

export const insertActivitySchema = createInsertSchema(activity).omit({
  id: true,
  createdAt: true,
});

export type Activity = typeof activity.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
