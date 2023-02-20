import { Hono } from "hono/mod.ts";
import { AppEnv } from "$/env.ts";

const app = new Hono<AppEnv>();
app.get("/hello", (c) => c.html("Hello"));
app.get("/", (c) => {
  return c.html(`
  <h3>This Is User Sites</h3>
  `);
});

export default app;
