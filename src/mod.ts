import { serve } from "std/http/mod.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv, getValidEnv } from "./env.ts";
import { decorateHtmlOutput, type TwindConfig } from "./middleware/html.ts";
import { liveReloadServer } from "./middleware/livereload.ts";
import { fileServer } from "./middleware/file_server.ts";
import app from "./routes/app.tsx";
import site from "./routes/site.tsx";

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
      rootUrl: new URL("./public", entryPoint),
      basePath: "/static/",
    }),
  );
  // end

  // begin vhost matching
  const disAllowedSubdomain = ["www", "app", "clients"];
  const subdomainPattern = new URLPattern({
    hostname: "*.(localhost|arisris|kodok.site)",
  });

  rootApp.all("*", (c, _next) => {
    const { 0: subdomain, 1: domain }: { 0?: string; 1?: string } =
      subdomainPattern.exec(c.req.url)?.hostname?.groups || {};
    if (
      subdomain &&
      !disAllowedSubdomain.some((i) => i === subdomain) &&
      subdomain.length > 3
    ) {
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
