import { serve } from "std/http/mod.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv, getValidEnv } from "./env.ts";
import { decorateHtmlOutput, type TwindConfig } from "./middleware/html.ts";
import { liveReloadServer } from "./middleware/livereload.ts";
import { fileServer } from "./middleware/file_server.ts";
import app from "./routes/app.tsx";
import site from "./routes/site.tsx";
import { parseUrlSubdomain } from "./lib/utils.ts";

export type StartOptions = {
  entryPoint: string;
  twindConfig: TwindConfig;
};

export function start({ entryPoint, twindConfig }: StartOptions) {
  const env = getValidEnv();
  const ac = new AbortController();
  // The app root
  const rootApp = new Hono<AppEnv>();

  // begin global route
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
  // end

  // begin app static
  app.use(
    "/static/*",
    fileServer({
      rootUrl: new URL("./resources/static", entryPoint),
      basePath: "/static/",
    }),
  );
  // end

  // begin vhost matching
  rootApp.all("*", (c, _next) => {
    const { subdomain, domain } = parseUrlSubdomain(c.req.url, {
      domains: ["localhost", "kodok.site", "kodok.app"],
      protectedSubdomains: ["www", "app", "clients"],
    }) || {};
    if (subdomain && subdomain.length > 3) {
      console.log(subdomain, domain);
      // todo match user mapped domain and subdomain
      return site.fetch(c.req.raw, c.env);
    }
    return app.fetch(c.req.raw, c.env);
  });

  // end

  serve((request, connInfo) =>
    rootApp.fetch(request, {
      env,
      entryPoint,
      connInfo,
    }), {
    signal: ac.signal,
    port: env.APP_PORT,
  });

  return () => {
    ac.abort();
  };
}
