import htmldom from "htmldom";
import { Handler as FinalHandler, serve } from "std/http/server.ts";
import { Hono } from "hono/mod.ts";
import { AppDB, AppEnv } from "./types.ts";
import { createKyPg } from "./utils/kypg.ts";
import { getValidEnv } from "./utils/env.ts";
import { handleHMR } from "./utils/hmr.ts";
import { serveStatic } from "./http/middleware/serve-static.ts";
import { mainRouter } from "./http/main.tsx";
import { createHttpCaller } from "./trpc/main.ts";

const validEnv = getValidEnv();
const ac = new AbortController();
const sockets = new Set<WebSocket>();
const db = createKyPg(validEnv.DATABASE_URL, {
  poolSize: 2,
  log: validEnv.DENO_ENV !== "production" ? ["error", "query"] : undefined,
}) as AppDB;
const rootRouter = new Hono<AppEnv>();
// main router
rootRouter.route("/", mainRouter);

// handle static assets
rootRouter.use("/static/*").all(serveStatic({
  rootUrl: new URL("../public", import.meta.url),
  basePath: "/static",
  weak: true,
}));

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
  const response = await rootRouter.fetch(req, {
    ...connInfo,
    ...env,
  });
  return response;
};

export async function configureServer() {
  
}

export function bootServer() {
  serve(finalHandler, { signal: ac.signal });
  // cleanup callback
  return async () => {
    console.log("Shutdown..");
    await db.destroy();
    ac.abort();
  };
}
