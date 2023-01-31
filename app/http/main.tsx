/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import { Hono } from "hono/mod.ts";
import { AppEnv } from "../types.ts";
import HomeUI from "../views/home.tsx";
import { jwtSession } from "./middleware/jwt-session.ts";

export const mainRouter = new Hono<AppEnv>();
const getSession = jwtSession({ maxAge: 3600 });

mainRouter
  .get("/", async (c) => {
    const sess = await getSession(c);
    if (!sess.counter) {
      sess.counter = 1;
    } else {
      //sess.counter = sess.counter as number + 1;
    }
    console.log(sess.counter);
    await sess.commit();
    return c.html(<HomeUI />);
  });
