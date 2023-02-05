/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv } from "../env.ts";

export const authRouter = new Hono<AppEnv>()
  .get("/", (c) => c.json({ msg: "OK" }));
