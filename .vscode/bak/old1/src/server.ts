import { Handler as FinalHandler, serve } from "std/http/server.ts";
import { Hono } from "hono/mod.ts";
import { AppDB, AppEnv } from "./types.ts";
import { createKyPg } from "./utils/kypg.ts";
import { getValidEnv } from "./utils/env.ts";
import { handleHMR } from "./utils/hmr.ts";
import { getSessionDefault } from "./middleware/jwt-session.ts";
import { serveStatic } from "./middleware/serve-static.ts";
import { createCaller, createHttpCaller } from "./trpc/main.ts";

const validEnv = getValidEnv();
const ac = new AbortController();
const sockets = new Set<WebSocket>();
const db = createKyPg(validEnv.DATABASE_URL, {
  poolSize: 2,
  log: validEnv.DENO_ENV !== "production" ? ["error", "query"] : undefined,
}) as AppDB;
const appRoot = new Hono<AppEnv>();
// main router
appRoot.get("/session-test", async (c) => {
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
  return c.html(`Hello`);
});

// handle static assets
appRoot.use("/static/*").all(serveStatic({
  rootUrl: new URL("../public", import.meta.url),
  basePath: "/static",
  weak: true,
}));

// appRoot.use("/-/pages/*").all(serveStatic({
//   rootUrl: new URL("./pages", import.meta.url),
//   basePath: "/-/pages",
//   weak: true,
// }));


const finalHandler: FinalHandler = async (req, connInfo) => {
  const url = new URL(req.url), env: AppEnv["Bindings"] = { validEnv, db };

  // handle hmr
  if (validEnv.DENO_ENV !== "production" && url.pathname === "/_hmr") {
    return handleHMR("/_hmr", req, sockets);
  }

  // handle trpc server
  if (url.pathname.startsWith("/trpc")) {
    return createHttpCaller(req, env);
  }

  // fetch hono router
  const response = await appRoot.fetch(req, {
    ...connInfo,
    ...env,
  });
  return response;
};

export function bootServer() {
  serve(finalHandler, { signal: ac.signal });
  // cleanup callback
  return async () => {
    console.log("Shutdown..");
    await db.destroy();
    ac.abort();
  };
}
