/** @jsx jsx */
import htmldom from "htmldom";
import { jsx } from "hono/middleware.ts";
import { type AppEnv, getValidEnv } from "./env.ts";
import { Hono } from "hono/hono.ts";
import { Handler, serve } from "std/http/server.ts";
import { apply, asyncVirtualSheet, getStyleTag, setup, tw } from "twind/server";
import { css } from "twind/css";
import { mainRouter } from "./http/main.tsx";
import NotFoundErrorUI from "./ui/errors/notfound.tsx";
import InternalErrorUI from "./ui/errors/internal.tsx";
import { Database } from "../api/database.ts";

const validEnv = await getValidEnv();
const database = Database.init(validEnv.DATABASE_URL);
const SOCKETS = new Set<WebSocket>();
const sheet = asyncVirtualSheet();
const globalCss = css({
  ":global": {
    "html": {
      boxSizing: "border-box",
    },
    "body": apply``,
    "a": apply`text-blue-600 no-underline hover:(underline)`,
  },
});
const rootRouter = new Hono<AppEnv>();
rootRouter.route("/", mainRouter);
rootRouter.notFound((c) => {
  const { pathname } = new URL(c.req.url);
  return c.html(<NotFoundErrorUI pathname={pathname} />, 404);
});
rootRouter.onError((e, c) => {
  return c.html(
    <InternalErrorUI error={e} debug={validEnv.DENO_ENV !== "production"} />,
  );
});

export const finalHandler: Handler = async (request, connInfo) => {
  sheet.reset();
  const url = new URL(request.url);
  if (validEnv.DENO_ENV !== "production" && url.pathname === "/_hmr") {
    if (request.headers.get("upgrade") == "websocket") {
      const { response, socket } = Deno.upgradeWebSocket(request);
      SOCKETS.add(socket);
      socket.onclose = () => {
        SOCKETS.delete(socket);
      };
      return response;
    } else {
      return new Response(
        `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"/_hmr";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`,
        {
          headers: {
            "content-type": "application/javascript; charset=utf-8;",
            "cache-control": "private, max-age=0, must-revalidate",
          },
        },
      );
    }
  }
  const response = await rootRouter.fetch(request, {
    ...connInfo,
    ...validEnv,
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
  return response
};

addEventListener("unload", () => {
  SOCKETS.forEach((socket) => {
    socket.send("refresh");
  });
});

setup({
  sheet,
  darkMode: "class",
  preflight: () => globalCss,
});

if (import.meta.main) {
  serve(finalHandler);
}
