// deno-lint-ignore-file
/** @jsx jsx */
import { filterKeys } from "https://deno.land/std@0.171.0/collections/filter_keys.ts";
import { setup as setupTwind, tw } from "https://esm.sh/twind@0.16.17";
import { getStyleTag, virtualSheet } from "https://esm.sh/twind@0.16.17/sheets";
import {
  html,
  jsx,
  JSXNode,
} from "https://deno.land/x/hono@v2.5.10/middleware.ts";
import {
  inferAsyncReturnType,
  initTRPC,
} from "https://esm.sh/@trpc/server@10.5.0";
import {
  FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "https://esm.sh/@trpc/server@10.5.0/adapters/fetch";
import { z } from "https://esm.sh/zod@3.20.2";
import { parse as flagsParse } from "https://deno.land/std@0.171.0/flags/mod.ts";
import {
  ConnInfo as HttpConnInfo,
  Handler as HttpHandler,
  serve as httpServe,
  Status as HttpStatus,
  STATUS_TEXT as HTTP_STATUS_TEXT,
} from "https://deno.land/std@0.171.0/http/mod.ts";
import {
  Context as HonoContext,
  Handler as HonoHandler,
  Hono,
} from "https://deno.land/x/hono@v2.5.10/mod.ts";
// import * as BcryptMod from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
// import * as JoseMod from "https://deno.land/x/jose@v4.11.1/index.ts";
import htmldom from "https://esm.sh/htmldom@4.0.11";
import clsx from "https://esm.sh/clsx@1.2.1";
import twindConfig from "./twind.config.ts";

// ENV FLAGS
const FLAGS = flagsParse(Deno.args, {
  boolean: ["dev", "minify-html"],
  string: ["pg-proxy", "internal-prefix", "api-prefix", "port", "secret"],
  default: {
    secret: Deno.env.get("APP_SECRET") ?? "secret",
    "api-prefix": "api",
    "internal-prefix": "_internal",
    "minify-html": true,
    "pg-proxy": Deno.env.get("PG_PROXY"),
  },
});

/** WEB */
function WEB_APP() {
  return new Hono<TYPES.AppEnv>()
    .get("/", (ctx) => {
      return ctx.html(
        <Component.AppLayout title="Simple deno blog platform">
          <h3>Hi. User</h3>
          <div class="inline-flex gap-2">
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
            <a href="/signout">Signout</a>
          </div>
          <p class="my-6">
            Welcome to `kodok`. Create accounts then you can enjoy by write
            &amp; publish your stories arround the world for free
          </p>
          <h3>Features:</h3>
          <ul class="list-disc px-6 children:py-1">
            <li>No ads</li>
            <li>Super fast</li>
            <li>Runing on edge server</li>
            <li>Globally distributed content</li>
            <li>Custom domain</li>
          </ul>
          <h3>Get started:</h3>
          <div class="inline-flex gap-2">
            <a href="/signin">Login</a>
            <a href="/signup">Register</a>
            <a href="/explore">Explore..</a>
          </div>
        </Component.AppLayout>,
      );
    })
    .get("/dashboard", (ctx) => {
      const title = "Dashboard";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/settings", (ctx) => {
      const title = "Settings";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/signout", (ctx) => {
      const title = "Signout";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/signin/:provider", (ctx) => {
      return ctx.redirect("/signin");
    })
    .get("/signin", (ctx) => {
      const title = "SignIn";
      return ctx.html(
        <Component.AppLayout title={title}>
          <form method="POST" class="max-w-[360px]">
            <div class="mb-2">
              <label for="email">Email:</label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Your email"
                autocomplete="current-email"
                required
              />
            </div>
            <div class="mb-2">
              <label for="password">Password:</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Your password"
                autocomplete="current-password"
                required
              />
            </div>
            <label for="remember" class="mb-2">
              <input
                type="checkbox"
                name="remember"
                id="remember"
                class="ml-0"
              />
              <span class="text-sm">Remember me</span>
            </label>
            <div class="my-2">
              <button type="submit">SignIn</button>
              <br />
              <br />
              <a href="/signup" class="text-sm">SignUp</a> |{" "}
              <a href="/reset-password" class="text-sm">Reset Password</a>
            </div>
          </form>
        </Component.AppLayout>,
      );
    })
    .get("/signup", (ctx) => {
      const title = "SignUp";
      return ctx.html(
        <Component.AppLayout title={title}>
          <form method="POST" class="max-w-[360px]">
            <div class="mb-2">
              <label for="email">Email:</label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Your email"
                autocomplete="new-email"
                required
              />
            </div>
            <Component.Notification
              boxed
              class="my-2 px-2 py-1"
              type="warning"
              message="Password is required with combined with special character eg. $^*#@!~"
            />
            <div class="mb-2">
              <label for="password">Password:</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Your password"
                autocomplete="new-password"
                required
              />
            </div>
            <div class="mb-2">
              <label for="password_confirm">Confirm:</label>
              <input
                type="password"
                name="password_confirm"
                id="password_confirm"
                placeholder="Confirm your password"
                autocomplete="new-password"
                required
              />
            </div>
            <div class="my-4">
              <label for="blog_name">Domains</label>
              <br />
              <i class="text-xs text-gray-500">
                Find your web identity availablility. We have free subdomain or
                you can chose top-level domain
              </i>
              <hr />
              <input type="text" name="blog_name" id="blog_name" required />
              <select name="blog_subid" required>
                <option value="0" selected="true">.kodok.site</option>
              </select>
            </div>
            <label for="accept" class="mb-2">
              <input type="checkbox" name="accept" id="accept" class="ml-0" />
              <span class="text-sm">
                By continue we thing you have read our{" "}
                <a href="/privacy-policy" class="italic">
                  Privacy Policy
                </a>{" "}
                &{" "}
                <a href="/terms-of-service" class="italic">
                  Terms of Service
                </a>
              </span>
            </label>
            <div class="my-2">
              <button type="submit">SignUp</button>
              <br />
              <br />
              <a href="/signin" class="text-sm">SignIn</a>
            </div>
          </form>
        </Component.AppLayout>,
      );
    })
    .get("/reset-password", (ctx) => {
      const title = "Reset Password";
      return ctx.html(
        <Component.AppLayout title={title}>
          <form method="POST" class="max-w-[360px]">
            <Component.Notification
              class="mb-6"
              message="We can reset your password by send token to your email. Please follow instruction"
              type="info"
              boxed
            />
            <div class="mb-2">
              <label for="email">Email:</label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Your email"
                autocomplete="new-email"
                required
              />
            </div>
            <div class="my-2">
              <button type="submit">Reset Password</button>
              <br />
              <br />
              <a href="/signin" class="text-sm">SignIn</a>
            </div>
          </form>
        </Component.AppLayout>,
      );
    })
    .get("/explore", (ctx) => {
      const title = "Explore";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/docs", (ctx) => {
      const title = "Documentation";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/privacy-policy", (ctx) => {
      const title = "Privacy Policy";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/terms-of-service", (ctx) => {
      const title = "Terms of Service";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/tools", (ctx) => {
      const title = "Tools";
      return ctx.html(
        <Component.AppLayout title={title}>
        </Component.AppLayout>,
      );
    })
    .get("/tools/bcrypt-generator", (ctx) => {
      const title = "Bcrypt Generator Tools";
      return ctx.html(
        <Component.AppLayout title={title}>
          <div x-data={`({"input": "hello worlds"})`}>
            <label for="input" x-text="input">Input</label>
            <br />
            <input type="text" name="input" id="input" x-model="input" />
          </div>
        </Component.AppLayout>,
      );
    });
}

/** INTERNAL */

function INTERNAL_APP() {
  const app = new Hono<TYPES.AppEnv>();
  //app.route(`/${FLAGS["api-prefix"]}`, API_APP());
  // dev only we are mount internal prefix for such livereload server
  if (FLAGS.dev) {
    const INTERNAL_APP_WS = new Set<WebSocket>();
    // reload browser on file change trigered because --watch flags
    globalThis.addEventListener("unload", () => {
      if (FLAGS.dev) {
        INTERNAL_APP_WS.forEach((socket) => {
          socket.send("refresh");
        });
      }
    });
    app.all(
      `/${FLAGS["internal-prefix"]}/livereload`,
      (ctx, next) => {
        if (ctx.req.headers.get("upgrade") == "websocket") {
          const { response, socket } = Deno.upgradeWebSocket(ctx.req);
          INTERNAL_APP_WS.add(socket);
          socket.onclose = () => {
            INTERNAL_APP_WS.delete(socket);
          };
          return response;
        }
        return new Response(HTTP_STATUS_TEXT[HttpStatus.BadRequest], {
          status: HttpStatus.BadRequest,
        });
      },
    );
    app.get(
      `/${FLAGS["internal-prefix"]}/livereload.js`,
      (ctx) =>
        ctx.text(
          `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"/${
            FLAGS["internal-prefix"]
          }/livereload";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`,
          200,
          {
            "content-type": "application/javascript; charset=utf-8;",
            "cache-control": "private, max-age=0, must-revalidate",
          },
        ),
    );
  }
  // mount main app
  app.route("/", WEB_APP());
  app.get("/favicon.ico", (ctx) => ctx.text(""));
  app.get("/test_error", (ctx) => {
    throw new Error("Holaaa Error");
  });

  app.notFound((ctx) => {
    return ctx.html(
      <Component.Document title="404 Not Found">
        <h3>Page Not Found</h3>
        <p>The page you requested was not found on our server</p>
      </Component.Document>,
    );
  });
  app.onError((err, ctx) => {
    if (FLAGS.dev) {
      console.error(err);
    }
    return ctx.html(
      <Component.Document title="404 Not Found">
        <h3>{err.message}</h3>
        {FLAGS.dev && <pre>{err.stack}</pre>}
      </Component.Document>,
    );
  });
  return app;
}

function INIT_AND_DONT_CALL_ME_AGAIN() {
  // BEGIN SYSTEM

  const __CONFIG = {
    hosts: {
      main: "kodok.localhost",
      api: "api.kodok.localhost",
      subdomains: [
        "kodok.localhost",
        "blog.localhost",
        "web.localhost",
        "app.localhost",
      ],
    },
  };
  const sheet = virtualSheet();
  setupTwind({ ...twindConfig, ...{ sheet } });
  const FINAL_HANDLER: HttpHandler = async (req, connInfo) => {
    // const { hostname } = new URL(req.url);
    const res = await INTERNAL_APP().fetch(req, {
      ...connInfo,
      ...filterKeys(FLAGS, (it) => it !== "_"),
    });
    if (res.headers.get("content-type")?.match("text/html")) {
      try {
        sheet.reset();
        const newRes = res.clone();
        const $ = htmldom(await newRes.text());
        // deno-lint-ignore no-explicit-any
        $("[class]").each((_: any, v: any) => {
          v.attributes.class = tw(v.attributes.class);
        });
        $("head").append(getStyleTag(sheet));
        if (FLAGS.dev) {
          $("head").append(
            `<script src="/${
              FLAGS["internal-prefix"]
            }/livereload.js"></script>`,
          );
        }
        const textBody = !FLAGS["minify-html"] || FLAGS.dev
          ? $.beautify()
          : $.uglify();
        return new Response(textBody, newRes);
      } catch (e) {
        console.error(e);
      }
    }
    return res;
  };

  const abortController = new AbortController();

  // listen shutdown this script
  globalThis.addEventListener("unload", () => {
    console.log("Shutingdown applications");
    abortController.abort();
  });
  // init server
  httpServe(FINAL_HANDLER, {
    port: FLAGS.port ? parseInt(FLAGS.port) : undefined,
    signal: abortController.signal,
  });
  // END SYSTEM
}

/**
 * Components storage
 * View Component shuld place in single class
 */

class Component {
  static Document(props: {
    title?: string;
    description?: string;
    headers?: TYPES.JSXChild;
    footers?: TYPES.JSXChild;
    children?: TYPES.JSXChild;
  }) {
    return html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${props.title ?? "Kodok.site"}</title>
          ${
      props.description && (
        <meta name="description" content={props.description} />
      )
    }
          ${props.headers}
        </head>
        <body>
          ${props.children}
          ${props.footers}
        </body>
      </html>
    `;
  }
  static AppLayout(props: {
    title?: string;
    description?: string;
    noscript?: boolean;
    children?: TYPES.JSXChild;
  }) {
    return (
      <Component.Document
        title={props.title}
        description={props.description}
        footers={[
          !props.noscript && (
            <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.10.5/dist/cdn.min.js">
            </script>
          ),
        ]}
      >
        <section class="font-sans p-4 flex flex-col justify-between min-h-[92vh] mx-auto max-w-screen-sm">
          <header>
            <div class="flex justify-between items-center">
              <a href="/" class="text-xl no-underline font-bold font-sans">
                K🐸dok
              </a>
              <div class="inline-flex gap-2 justify-center">
                <a href="/tools">Tools</a>
                <a href="/docs">Documentation</a>
              </div>
            </div>
            <h1>{props.title || "Kodok.site"}</h1>
          </header>
          <main class="flex-auto mb-8">
            {props.children}
          </main>
          <footer class="flex flex-col sm:flex-row-reverse gap-2 justify-between items-center">
            <div class="flex gap-2 flex-nowrap">
              <a href="/privacy-policy">Privacy policy</a>
              <a href="/terms-of-service">Terms of service</a>
            </div>
            <div class="flex items-center gap-1">
              <span>&copy; {new Date().getFullYear()}</span>
              <a href="/" class="no-underline">Kodok.site</a>
            </div>
          </footer>
        </section>
      </Component.Document>
    );
  }
  static Notification(props: {
    type: "danger" | "success" | "warning" | "info";
    message: string;
    class?: string;
    boxed?: boolean;
  }) {
    return (
      <div
        class={clsx(
          props.boxed && tw`p-2 ring ring-1`,
          props.boxed && ({
            [tw`bg-red-50 ring-red-300`]: props.type === "danger",
            [tw`bg-green-50 ring-green-300`]: props.type === "success",
            [tw`bg-yellow-50 ring-yellow-300`]: props.type === "warning",
            [tw`bg-blue-50 ring-blue-300`]: props.type === "info",
          }),
          props.class,
        )}
      >
        <span
          class={clsx(
            tw`text-xs font-mono`,
            {
              [tw`text-red-500`]: props.type === "danger",
              [tw`text-green-500`]: props.type === "success",
              [tw`text-yellow-500`]: props.type === "warning",
              [tw`text-blue-500`]: props.type === "info",
            },
          )}
        >
          {props.message}
        </span>
      </div>
    );
  }
}

/**
 * DATABASE
 */

class DB {
  static readonly schemaDef = `create table users (
    "id" serial primary key,
    "email" varchar(128) not null unique,
    "meta" jsonb not null default '{}'::jsonb
  );
  create table sites (
    "id" serial primary key,
    "owner_id" serial not null references users(id),
    "meta" jsonb not null default '{}'::jsonb
  );`;
  constructor() {}
  static async query(sql: string, args?: unknown[]) {
    const response = await fetch(`${FLAGS["pg-proxy"]}/query`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "authorization": `Bearer ${FLAGS["secret"]}`,
      },
      body: JSON.stringify({
        query: sql,
        args,
      }),
    });
    return response.json();
  }
}

class TRPC {
  static async createContext({ req }: FetchCreateContextFnOptions) {
    await Promise.resolve(1);
    return {
      hello: "World",
    };
  }
  static get routes() {
    const t = this.#t;
    return t.router({
      hello: t.procedure.query(({ ctx }) => {
        return `Hello World Bro`;
      }),
    });
  }
  static handler(): HonoHandler<TYPES.AppEnv> {
    return (ctx) => {
      return new Response("OK");
    };
  }
  static get #t() {
    return initTRPC.context<inferAsyncReturnType<typeof TRPC.createContext>>()
      .create();
  }
}

/** Helpers */

class Helpers {
  static async validateFormData<T extends z.Schema>(
    schema: T,
    ctx: HonoContext<string, TYPES.AppEnv>,
  ): Promise<Awaited<z.TypeOf<T>>> {
    const formData = Object.fromEntries((await ctx.req.formData()).entries());
    return schema.parseAsync(formData);
  }
}

/** TYPES Storage */

declare namespace TYPES {
  type JSXChild = string | number | JSXNode | JSXChild[];
  interface AppEnv {
    Bindings:
      & HttpConnInfo
      & Record<string, unknown>;
    // deno-lint-ignore no-explicit-any
    Variables: Record<string, any>;
  }
  interface DBResult<T> {
    rows: T[];
  }
  namespace TRPC {
    type Context = {
      hello: string;
    };
  }
}

// Run init
INIT_AND_DONT_CALL_ME_AGAIN();
