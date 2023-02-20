import { serve } from "std/http/mod.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv, getValidEnv } from "./env.ts";
import { decorateHtmlOutput, TwindConfig } from "./middleware/html.ts";
import { liveReloadServer } from "./middleware/livereload.ts";
import { fileServer } from "./middleware/file_server.ts";

const app = new Hono<AppEnv>();
app.get("/hello", (c) => c.html("Hello"));
app.get("/", (c) => {
  return c.html(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body x-data="{count: 0}">
      <h3 class="text-red-500">Simple Alpine Counter</h3>
      <h4 class="text-purple-500">Count: <span x-text="count" class="text-green-500">0</span></h4>
      <button class="px-2 focus:ring-1" type="button" x-on:click="count++">Inc</button>
      <button class="px-2 focus:ring-1" type="button" x-on:click="count--">Dec</button>
    </body>
  </html>`);
});

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
