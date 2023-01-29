import { Bindings, Hono, sql, start } from "./deps.ts";

const app = new Hono<{ Bindings: Bindings }>();
app.get("/", async (c) => {
  const data = await c.env.db.withSchema("blog_app")
    .selectFrom("users")
    .innerJoin("sites", (join) => join.onRef("sites.id", "=", "users.id"))
    .select([
      "users.id",
      "users.user_login",
      "users.user_email",
      sql`json_agg(json_build_object('id', sites.id, 'site_name', sites.site_name))`
        .as("sites"),
    ])
    .where("users.id", "=", 1)
    .groupBy("users.id")
    .executeTakeFirst();
  c.pretty(true);
  return c.json({ msg: "Hiirrr", data });
});

await start(app);
