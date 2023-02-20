import { serve } from "std/http/mod.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv, getValidEnv } from "./env.ts";
import { decorateHtmlOutput, TwindConfig } from "./middleware/html.ts";
import { liveReloadServer } from "./middleware/livereload.ts";
import { fileServer } from "./middleware/file_server.ts";
import app from "./routes/app.tsx";

export type StartOptions = {
  entryPoint: string;
  twindConfig: TwindConfig;
};

export function start({ entryPoint, twindConfig }: StartOptions) {
  const env = getValidEnv();
  const ac = new AbortController();
  // The app root
  const rootApp = new Hono<AppEnv>();
  rootApp.use(
    "*",
    decorateHtmlOutput({
      twindConfig,
      useAlpine: true,
      excludePaths: ["/static/*"],
      appendHead: [`<script src="/_hmr"></script>`],
    }),
  );
  rootApp.use(
    "/_hmr",
    liveReloadServer({
      enabled: env.DENO_ENV !== "production",
      endpoint: "/_hmr",
      signal: ac.signal,
    }),
  );

  rootApp.route("/", app);

  rootApp.use(
    "/static/*",
    fileServer({
      rootUrl: new URL("./public", entryPoint),
      basePath: "/static/",
    }),
  );

  //console.log(rootApp.showRoutes())

  serve(async (request, connInfo) => {
    const response = await rootApp.fetch(request, {
      env,
      entryPoint,
      connInfo,
    });
    return response;
  }, {
    signal: ac.signal,
    port: env.APP_PORT,
  });

  return () => {
    ac.abort();
  };
}
