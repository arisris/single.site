/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv } from "../env.ts";
import HomeUI from "../ui/home.tsx";
import { authRouter } from "./auth.tsx";
import { handleStaticFile } from "./middleware/static.ts";

export const mainRouter = new Hono<AppEnv>()
  .route("/auth", authRouter)
  .get("/", (c) => {
    return c.html(<HomeUI />);
  })
  .all(
    "/static/*",
    handleStaticFile({
      rootUrl: new URL("../static", import.meta.url),
      basePath: "/static",
      weak: true,
    }),
  );
