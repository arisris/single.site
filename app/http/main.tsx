/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import { Hono } from "hono/mod.ts";
import { AppEnv } from "../types.ts";
import { getSessionDefault } from "./middleware/jwt-session.ts";
import HomeUI from "../views/home.tsx";
import { createCaller } from "../trpc/main.ts";

export const mainRouter = new Hono<AppEnv>();

mainRouter
  .get("/", async (c) => {
    const caller = await createCaller(c.env);
    const hello = await caller.hello();
    console.log(hello);
    const sess = await getSessionDefault(c);
    if (!sess.counter) {
      sess.counter = 1;
    } else {
      sess.counter = sess.counter as number + 1;
    }
    console.log(sess.counter);
    await sess.commit();
    return c.html(<HomeUI />);
  });
