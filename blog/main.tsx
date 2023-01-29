import { Hono, sql, z } from "./lib/deps.ts";
import { Bindings, start } from "./lib/system.ts";
//import { jwt } from "https://deno.land/x/hono@v2.5.10/middleware.ts";
import { Jwt } from "https://deno.land/x/hono@v2.5.10/utils/jwt/index.ts";

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
    .limit(1)
    .groupBy("users.id")
    .executeTakeFirst();
  c.pretty(true);
  return c.json({ msg: "Hiirrr", data });
});
app.post("/authenticate/password", async (c) => {
  const input = await z.object({
    login: z.string().min(1),
    password: z.string().min(1),
  }).parseAsync(await c.req.json());
  const user = await c.env.db.withSchema("blog_app")
    .selectFrom("users")
    .where("user_email", "=", input.login)
    .orWhere("user_login", "=", input.login)
    .select(["id", "user_email", "user_login", "user_password"])
    .limit(1)
    .executeTakeFirstOrThrow();
  if (!user.user_password) throw new Error("Password not set");
  
  return c.json({ msg: "Hi", user });
});
app.post("/create-user", (c) => {
  return c.json({ msg: "Hi" });
});
app.onError((err, c) => {
  console.error(err);
  return c.json({
    msg: err.message,
  }, 500);
});

await start(app);
