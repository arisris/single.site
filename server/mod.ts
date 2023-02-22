import { type Handler, serve, serveTls } from "std/http/mod.ts";
import { Hono } from "hono/mod.ts";
import { type AppEnv, getValidEnv } from "./env.ts";
import { decorateHtmlOutput, type TwindConfig } from "./middleware/html.ts";
import { liveReloadServer } from "./middleware/livereload.ts";
import { fileServer } from "./middleware/file_server.ts";
import { parseUrlSubdomain } from "./lib/utils.ts";
import app from "./routes/app.tsx";
import site from "./routes/site.tsx";

export type StartOptions = {
  entryPoint: string;
  twindConfig: TwindConfig;
  secure?: {
    certFile: string;
    keyFile: string;
  };
};

export function start({ entryPoint, twindConfig, secure }: StartOptions) {
  const env = getValidEnv();
  const ac = new AbortController();
  const hmrUrl = `http${secure ? "s" : ""}://${env.APP_DOMAIN}/_hmr`;

  // hmr
  app.use(
    "/_hmr",
    liveReloadServer({
      enabled: env.DENO_ENV !== "production",
      endpoint: hmrUrl,
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
  // The app root
  const rootApp = new Hono<AppEnv>();

  // begin global route
  rootApp.use(
    "*",
    decorateHtmlOutput({
      twindConfig,
      useAlpine: true,
      excludePaths: ["/static/*"],
      appendHead: [`<script src="${hmrUrl}"></script>`],
    }),
  );
  rootApp.all("*", (c, _next) => {
    const url = new URL(c.req.raw.url);
    const domains = c.env.env.APP_DOMAINS;
    const mainDomain = c.env.env.APP_DOMAIN;
    const redirectToMainDomain = () =>
      c.redirect(
        `${url.protocol}//${mainDomain}${
          url.port ? `:${url.port}${url.pathname}` : ""
        }`,
      );
    const matched = parseUrlSubdomain(url.hostname, {
      domains,
      protectedSubdomains: ["www", "app", "clients", "admin"],
    });
    if (matched?.subdomain && domains.includes(matched.domain)) {
      // console.log(matched);
      // todo match user mapped domain and subdomain
      // render site
      return site.fetch(c.req.raw, c.env);
    }
    // TODO also resolve site with custom domain?

    // redirect non matched subdomain to main domain
    if (!domains.includes(url.hostname) && url.hostname !== mainDomain) {
      // redirect
      return c.notFound();
    }
    if (url.hostname !== mainDomain) {
      return redirectToMainDomain();
    }
    // render main app
    return app.fetch(c.req.raw, c.env);
  });

  // end
  const finalHandler: Handler = (request, connInfo) =>
    rootApp.fetch(request, {
      env,
      entryPoint,
      connInfo,
    });
  if (secure) {
    serveTls(finalHandler, {
      signal: ac.signal,
      cert: Deno.readTextFileSync(new URL(secure.certFile, entryPoint)),
      key: Deno.readTextFileSync(new URL(secure.keyFile, entryPoint)),
      port: env.APP_PORT,
    });
  } else {
    serve(finalHandler, {
      signal: ac.signal,
      port: env.APP_PORT,
    });
  }

  return () => {
    ac.abort();
  };
}
