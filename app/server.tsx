/** @jsx jsx */
import htmldom from "htmldom";
import { Handler as FinalHandler, serve } from "std/http/server.ts";
import { Hono } from "hono/mod.ts";
import { jsx } from "hono/middleware.ts";
import { AppDB, AppEnv } from "./types.ts";
import { createKyPg } from "./utils/kypg.ts";
import { getValidEnv } from "./utils/env.ts";
import { handleHMR } from "./utils/server.ts";
import { getStyleTag, initializeTwind, tw } from "./utils/twind.ts";
import { serveStatic } from "./http/middleware/serve-static.ts";
import { mainRouter } from "./http/main.tsx";
import InternalErrorUI from "./views/errors/internal.tsx";
import NotFoundErrorUI from "./views/errors/notfound.tsx";
import twindConfig from "../twind.config.ts";

const validEnv = getValidEnv();
const ac = new AbortController();
const sockets = new Set<WebSocket>();
const sheet = initializeTwind(twindConfig);
const db = createKyPg(validEnv.DATABASE_URL, {
  poolSize: 2,
  log: validEnv.DENO_ENV !== "production" ? ["error", "query"] : undefined,
}) as AppDB;
const rootRouter = new Hono<AppEnv>();

rootRouter.route("/", mainRouter);

rootRouter.all(
  "/*",
  serveStatic({
    rootUrl: new URL("../public", import.meta.url),
    basePath: "/",
    weak: true,
  }),
);

rootRouter.notFound((c) => {
  const { pathname } = new URL(c.req.url);
  return c.html(<NotFoundErrorUI pathname={pathname} />, 404);
});

rootRouter.onError((e, c) => {
  return c.html(
    <InternalErrorUI error={e} debug={validEnv.DENO_ENV !== "production"} />,
    500,
  );
});

const finalHandler: FinalHandler = async (req, connInfo) => {
  sheet.reset();
  const url = new URL(req.url);
  if (validEnv.DENO_ENV !== "production" && url.pathname === "/_hmr") {
    return handleHMR("/_hmr", req, sockets);
  }
  const response = await rootRouter.fetch(req, {
    ...connInfo,
    ...{ validEnv, db },
  });
  if (response.headers.get("content-type")?.match("text/html")) {
    const cloned = response.clone();
    const $$ = htmldom(await cloned.text());
    const $head = $$("head"), $body = $$("body");
    // skip if no head or body tag
    if ($head.__length__ < 1 && $body.__length__ < 1) return response;
    let hasAlpine = false;
    // deno-lint-ignore no-explicit-any
    $$("*").each((_: number, tag: any) => {
      if (tag.attributes.class && tag.attributes.class.length) {
        tag.attributes.class = tw(tag.attributes.class);
      }
      if (
        !hasAlpine && (tag.attributes["x-data"] || tag.attributes["x-init"])
      ) {
        hasAlpine = true;
      }
    });

    if (sheet.target.length) {
      $head.append(getStyleTag(sheet));
    }
    if (validEnv.DENO_ENV !== "production") {
      $body.append(`<script src="/_hmr"></script>`);
    }
    if (hasAlpine) {
      $body.append(
        `<script type="module" src="/main.js"></script>`,
      );
    }
    return new Response($$.beautify(), cloned);
  }

  return response;
};

export function bootServer() {
  serve(finalHandler, { signal: ac.signal });
  return async () => {
    console.log("Shutdown..");
    await db.destroy();
    ac.abort();
  };
}
