import { Hono } from "hono/mod.ts";
import { AppEnv } from "$/env.ts";
import Home from "$/ui/home.tsx";

const app = new Hono<AppEnv>();
app.get("/hello", (c) => c.html("Hello"));
app.get("/", (c) => {
  return c.html(<Home />);
});

export default app;
