//import { jwt } from "https://deno.land/x/hono@v2.5.10/middleware.ts";
// import { Jwt } from "https://deno.land/x/hono@v2.5.10/utils/jwt/index.ts";
import { Hono } from "https://deno.land/x/hono@v2.5.10/hono.ts";
import { Bindings, start } from "./system.ts";
import { accountRouter, httpHandler } from "./trpc.ts";

const app = new Hono<{ Bindings: Bindings }>();
app.all("/api/*", httpHandler);
app.get("/", async (c) => {
  const account = accountRouter.createCaller(c.env);
  const data = await account.me();
  return c.json(data);
});

app.notFound((c) => {
  return c.json({
    msg: "404 Not Found!",
  }, 404);
});
app.onError((err, c) => {
  console.error(err);
  return c.json({
    msg: err.message,
  }, 500);
});

await start(app);
