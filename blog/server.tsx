/** @jsx jsx */
import htmldom from "https://esm.sh/htmldom@4.0.11";
import { load as loadEnv } from "https://deno.land/std@0.171.0/dotenv/mod.ts";
import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.171.0/path/mod.ts";
import { serve } from "https://deno.land/std@0.171.0/http/server.ts";
import { parse as parseFlags } from "https://deno.land/std@0.171.0/flags/mod.ts";
import {
  Handler,
  Hono,
  MiddlewareHandler,
} from "https://deno.land/x/hono@v2.7.2/mod.ts";
import {
  getStatusText,
  StatusCode,
} from "https://deno.land/x/hono@v2.7.2/utils/http-status.ts";
import { type CookieOptions } from "https://deno.land/x/hono@v2.7.2/utils/cookie.ts";
import { Jwt } from "https://deno.land/x/hono@v2.7.2/utils/jwt/index.ts";

import {
  cache as cacheMiddleware,
  compress as compressMiddleware,
  cors as corsMddleware,
  etag as etagMiddleware,
  html,
  jsx,
  JSXNode,
  serveStatic,
} from "https://deno.land/x/hono@v2.7.2/middleware.ts";
import {
  apply,
  getStyleTag,
  setup as twindSetup,
  tw,
  virtualSheet,
} from "https://esm.sh/twind@0.16.17/server";
import { css } from "https://esm.sh/twind@0.16.17/css";
import { z } from "https://esm.sh/zod@3.19.1";
import {
  Client as PGClient,
  type ClientOptions as PGClientOptions,
  Pool as PGPool,
  PoolClient as PGPoolClient,
} from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { getMimeType } from "https://deno.land/x/hono@v2.7.2/utils/mime.ts";
import { AlgorithmTypes } from "https://deno.land/x/hono@v2.7.2/utils/jwt/types.ts";

// start code

const CONF = await getValidConfiguration(), /* Valid configuration OR Throw */
  AC = new AbortController(),
  POOL = new PGPool(CONF.db.options, CONF.db.pool_size, true),
  SOCKETS = new Set<WebSocket>();

const ROUTER = createHonoApp().get("/", async (c) => {
  // const db = await c.db.queryObject`select gen_random_uuid()`;
  // console.log(db.rows);
  return c.html(
    <CLayout title="Simple deno blog platform">
      <h3>Hi. User</h3>
      <div class="inline-flex gap-2">
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
        <a href="/signout">Signout</a>
      </div>
      <p class="my-6">
        Welcome to `kodok`. Create accounts then you can enjoy by write &amp;
        publish your stories arround the world for free
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
      <h3>Simple Counter</h3>
      <div x-data={`{counter: 0}`}>
        <div class="text-xl" x-text="counter">0</div>
        <button x-on:click="counter++">Increment</button>
      </div>
    </CLayout>,
  );
}).get("/signout", (ctx) => {
  return ctx.redirect("/signin");
}).get("/signin/:provider", (ctx) => {
  return ctx.redirect("/signin");
}).post(
  "/signin",
  async (c) => {
    const v = await z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).spa(await c.req.parseBody());

    return c.redirect(c.req.url);
  },
).get("/signin", (ctx) => {
  const title = "SignIn";
  return ctx.html(
    <CLayout title={title}>
      <h3>{title}</h3>
      <form
        method="POST"
        class="max-w-[360px]"
      >
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
          <button type="submit">
            SignIn
          </button>
          <br />
          <br />
          <a href="/signup" class="text-sm">SignUp</a> |{" "}
          <a href="/reset-password" class="text-sm">Reset Password</a>
        </div>
      </form>
    </CLayout>,
  );
}).get("/signup", (ctx) => {
  const title = "SignUp";
  return ctx.html(
    <CLayout title={title}>
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
        <CNotif
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
            Find your web identity availablility. We have free subdomain or you
            can chose top-level domain
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
    </CLayout>,
  );
}).get("/reset-password", (ctx) => {
  const title = "Reset Password";
  return ctx.html(
    <CLayout title={title}>
      <form method="POST" class="max-w-[360px]">
        <CNotif
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
    </CLayout>,
  );
}).get("/explore", (ctx) => {
  const title = "Explore";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).get("/dashboard", (ctx) => {
  const title = "Dashboard";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).get("/docs", (ctx) => {
  const title = "Documentation";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).get("/privacy-policy", (ctx) => {
  const title = "Privacy Policy";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).get("/terms-of-service", (ctx) => {
  const title = "Terms of Service";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).get("/tools", (ctx) => {
  const title = "Tools";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).get("/tools/bcrypt-generator", (ctx) => {
  const title = "Bcrypt Generator Tools";
  return ctx.html(
    <CLayout title={title}>
      <div x-data={`({"input": "hello worlds"})`}>
        <label for="input" x-text="input">Input</label>
        <br />
        <input type="text" name="input" id="input" x-model="input" />
      </div>
    </CLayout>,
  );
}).get("/settings", (ctx) => {
  const title = "Settings";
  return ctx.html(
    <CLayout title={title}>
    </CLayout>,
  );
}).notFound((c) => {
  const { pathname } = new URL(c.req.url);
  return c.html(
    <CHTMLDoc title="404 Not Found">
      <h3>Page Not Found</h3>
      <p>
        The page you requested "<b>{pathname}</b>" was not found on our server
      </p>
      <p>
        <a href="/">&laquo; Back to home</a>
      </p>
    </CHTMLDoc>,
  );
}).onError((e, c) => {
  const url = new URL(c.req.url);
  // if (isHttpError(e)) {
  //   if (url.pathname.startsWith("/api")) {
  //     return c.json({
  //       error: true,
  //       message: e.message,
  //     }, e.status);
  //   }
  // }
  return c.html(
    <CHTMLDoc title="404 Not Found">
      <h3>{e.message}</h3>
      {CONF.mode === "production" && <pre>{e.stack}</pre>}
      <p>
        <a href="/">&laquo; Back to home</a>
      </p>
    </CHTMLDoc>,
  );
});

// unload this app & cleanup
addEventListener("unload", async () => {
  AC.abort();
  SOCKETS.forEach((socket) => {
    socket.close();
  });
  POOL.end();
});

// self executed at once
(function () {
  const sheet = virtualSheet();

  twindSetup({
    sheet,
    preflight: () =>
      css({
        ":global": {
          "html": {
            boxSizing: "border-box",
          },
          "body": apply`font-sans`,
          "a": apply`text-blue-600 no-underline hover:(underline)`,
        },
      }),
  });

  const handleStaticFile = (opts: {
    rootUrl: URL;
    basePath?: string;
    weak?: boolean;
  }): MiddlewareHandler => {
    const stattag = (stat: Deno.FileInfo) => {
      const mtime = stat.mtime?.getTime().toString(16);
      const size = stat.size.toString(16);
      return `"${size}-${mtime}"`;
    };
    const root = fromFileUrl(opts.rootUrl);
    return async (c, next) => {
      if (!opts.basePath) {
        opts.basePath = "/";
      }
      const requestedPath = new URL(c.req.url).pathname;
      if (!requestedPath.startsWith(opts.basePath)) {
        return next();
      }
      const fileUrl = join(root, requestedPath.slice(opts.basePath.length));
      let file: Deno.FsFile | undefined;
      try {
        file = await Deno.open(fileUrl, { read: true, write: false });
        const fileStat = await file.stat();
        if (!fileStat.isFile) return next();
        c.res.headers.set("access-control-allow-origin", "*");
        c.res.headers.set(
          "content-type",
          getMimeType(fileUrl) ?? "application/octet-stream",
        );
        if (CONF.mode === "production") {
          c.res.headers.set("cache-control", "public, max-age=31536000");

          // cache using etag
          c.res.headers.append("vary", "If-None-Match");
          const etag = stattag(fileStat);
          c.res.headers.set("etag", opts.weak ? "W/" + etag : etag);
          const ifNoneMatch = c.req.headers.get("if-none-match");
          if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
            return c.newResponse(null, 304);
          }

          // cache using lastModifiedSince
          // c.res.headers.append("vary", "If-Modified-Since");
          // const lastModifiedTime = fileStat.mtime?.toUTCString();
          // if (lastModifiedTime) {
          //   c.header("last-modified", lastModifiedTime);
          //   const lastModifiedSince = c.req.headers.get("if-modified-since");
          //   if (
          //     lastModifiedSince &&
          //     (new Date(lastModifiedSince).toUTCString() ===
          //       lastModifiedTime)
          //   ) {
          //     return c.newResponse(null, 304);
          //   }
          // }
        } else {
          // disable cache
          c.res.headers.set(
            "cache-control",
            "private, max-age=0, no-cache, no-store, must-revalidate",
          );
        }

        c.res.headers.set("content-encoding", "gzip");
        const fileContent = file.readable.pipeThrough(
          new CompressionStream("gzip"),
        );
        // c.header("content-length", String(fileStat.size));
        return c.newResponse(fileContent, 200);
      } catch (_e) {
        // do nothing
      }
      return next();
    };
  };
  ROUTER.all(
    "/*",
    handleStaticFile({
      weak: true,
      rootUrl: new URL("./public", import.meta.url),
    }),
  );
  serve(async (request, connInfo) => {
    sheet.reset();
    const response = await ROUTER.fetch(request, { connInfo } as never);
    if (response.headers.get("content-type")?.match("text/html")) {
      const cloned = response.clone();
      const $$ = htmldom(await cloned.text());
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
        $$("head").append(getStyleTag(sheet));
      }
      if (CONF.mode !== "production") {
        $$("body").append(`<script src="/_hmr"></script>`);
      }
      if (hasAlpine) {
        $$("body").append(
          `<script type="module" src="/main.js"></script>`,
        );
      }
      return new Response($$.beautify(), cloned);
    }

    return response;
  }, { signal: AC.signal, port: CONF.port });
})();

// components
function CHTMLDoc(
  props: PropsWithChildren<{
    title?: string;
    description?: string;
    headers?: JSXChild;
    footers?: JSXChild;
  }>,
) {
  return html`<!DOCTYPE html>${(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {props.title && <title>{props.title}</title>}
        {props.description && (
          <meta
            name="description"
            content={props.description}
          />
        )}
        {props.headers}
      </head>
      <body>
        {props.children}
        {props.footers}
      </body>
    </html>
  )}`;
}

function CLayout(
  props: PropsWithChildren<{
    title?: string;
    description?: string;
    noscript?: boolean;
  }>,
) {
  return (
    <CHTMLDoc
      title={props.title}
      description={props.description}
    >
      <section class="absolute inset-0 px-4 flex flex-col justify-between mx-auto max-w-screen-sm">
        <header class="py-4">
          <div class="flex justify-between items-center">
            <a href="/" class="text-xl font-bold">
              Brand
            </a>
            <div class="inline-flex gap-2 justify-center">
              <a href="/tools" class="font-bold">Tools</a>
              <a href="/docs" class="font-bold">Documentation</a>
            </div>
          </div>
        </header>
        <main class="flex-auto pb-4">
          {props.children}
        </main>
        <footer class="flex flex-col sm:flex-row-reverse gap-2 justify-between items-center py-4">
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
    </CHTMLDoc>
  );
}

function CNotif(props: {
  type: "danger" | "success" | "warning" | "info";
  message: string;
  class?: string;
  boxed?: boolean;
}) {
  return (
    <div
      class={tw(
        props.boxed ? "p-2 ring ring-1" : undefined,
        props.boxed && ({
          "bg-red-50 ring-red-300": props.type === "danger",
          "bg-green-50 ring-green-300": props.type === "success",
          "bg-yellow-50 ring-yellow-300": props.type === "warning",
          "bg-blue-50 ring-blue-300": props.type === "info",
        }),
        props.class,
      )}
    >
      <span
        class={tw(
          "text-xs font-mono",
          {
            "text-red-500": props.type === "danger",
            "text-green-500": props.type === "success",
            "text-yellow-500": props.type === "warning",
            "text-blue-500": props.type === "info",
          },
        )}
      >
        {props.message}
      </span>
    </div>
  );
}

class Helper {
  static random = (max = 10) =>
    Math.floor(Math.random() * Date.now()).toString(36);
  static randomId(max = 10) {
    let str = "";
    for (let i = 0; i < max / 3 + 1; i++) str += this.random();
    return str.substring(0, max);
  }
  static fakeArray = (size = 5) =>
    Array(size)
      .fill(null)
      .map((_, k) => k);
}

async function getValidConfiguration() {
  const envFile = (ext?: string) =>
    new URL(`./.env${ext ? `.${ext}` : ``}`, import.meta.url).pathname;

  await loadEnv({
    defaultsPath: envFile("defaults"),
    examplePath: envFile("example"),
    envPath: envFile(),
    export: true,
  });

  const flags = parseFlags(Deno.args, {
    boolean: ["install"],
    string: ["port", "db", "secret", "mode"],
    default: {
      db: Deno.env.get("DATABASE_URL"),
      secret: Deno.env.get("APP_KEY"),
      port: "8000",
      mode: Deno.env.get("DENO_DEPLOYMENT_ID")
        ? "production"
        : Deno.env.get("DENO_ENV"),
    },
  });
  const result = await z.object({
    mode: z.enum(["development", "staging", "production"]).default(
      "development",
    ),
    db: z.string().url().superRefine((arg, ctx) => {
      if (!arg.startsWith("postgres")) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid dsn: Currently we only support postgres database",
        });
      }
    }).transform((urlString) => {
      let {
        hostname,
        port,
        username: user,
        password,
        searchParams,
        pathname,
      } = new URL(
        urlString,
      );
      const [_, database] = pathname.split("/");
      const options: PGClientOptions = {
        applicationName: searchParams.get("name") ?? "single_site_blog",
        database,
        hostname,
        port,
        user,
        password,
      };
      const pool_size = parseInt(searchParams.get("poolSize") ?? "");
      return {
        options,
        pool_size: isNaN(pool_size) ? 4 : pool_size,
      } as const;
    }),
    secret: z.string().min(32),
    port: z.string().min(2).max(4).transform((s) => {
      let port = parseInt(s);
      if (isNaN(port)) {
        port = 8000;
      }
      return port;
    }),
  }).parseAsync(flags);

  // todo install

  if (result.db && flags.install) {
    await installDatabase(result.db.options);
    Deno.exit();
  }

  return Object.seal(result) as Readonly<typeof result>;
}

async function installDatabase(options: PGClientOptions) {
  const confirmed = prompt(
    "Warning: This will drop your database. Do you want to continue? y/n",
    "n",
  );
  if (confirmed !== "y") {
    console.log("Canceled..");
    return;
  }
  console.log("Being install database");
  const schema = `
drop schema if exists system_schema cascade;

create schema system_schema;

create table system_schema.users (
  "id" uuid primary key default gen_random_uuid(),
  "name" varchar(256),
  "email" varchar(256) unique not null,
  "email_verified_at" timestamp,
  "password" varchar(256) not null,
  "role" integer not null default 0,
  "avatar_url" text,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now()
);

-- create table system_schema.files (
--   "id" uuid primary key default gen_random_uuid(),
--   "user_id" uuid not null references system_schema.users(id)
-- )

create table system_schema.posts (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid not null references system_schema.users(id),
  "title" text not null,
  "content" text not null default '',
  "status" integer not null default 0,
  "private" boolean not null default false,
  "metadata" jsonb not null default '{}'::jsonb,
  "created_at" timestamp not null default now(),
  "updated_at" timestamp not null default now()
);

-- select * from information_schema.tables where table_schema='system_schema';
  `;
  const client = new PGClient(options);
  await client.connect();
  const result = await client.queryObject(schema);
  result.warnings.forEach((w) => {
    console.warn(w.message);
  });
  console.info("OK");
  await client.end();
}

function createHMRHandler(): Handler {
  return async (ctx, next) => {
    // dont do in production
    if (CONF.mode === "production") return next();
    if (ctx.req.headers.get("upgrade") == "websocket") {
      const { response, socket } = Deno.upgradeWebSocket(ctx.req);
      SOCKETS.add(socket);
      socket.onclose = () => {
        SOCKETS.delete(socket);
      };
      return response;
    } else {
      return ctx.newResponse(
        `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"/_hmr";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`,
        200,
        {
          "content-type": "application/javascript; charset=utf-8;",
          "cache-control": "private, max-age=0, must-revalidate",
        },
      );
    }
  };
}

function createPostgresMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    c.db = await POOL.connect();
    c.set("db_connected", true);
    await next();
    if (c.db.connected) {
      c.db.release();
      c.set("db_connected", false);
    }
  };
}

function createSessionMiddleware(opts?: {
  cookieName?: string;
  cookieOptions?: CookieOptions;
  skipPaths?: string[];
}): MiddlewareHandler {
  let cookieName = opts?.cookieName ?? "ssb_session",
    cookieOptions: CookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
      ...(opts?.cookieOptions ?? {}),
    },
    data: AnyRecord = {},
    flashData: AnyRecord = {},
    expiresAt: Date | null = null,
    destroy = () => {
      data = {};
      flashData = {};
    },
    setExpires = (date: Date) => {
      expiresAt = date;
      return;
    },
    proxy = new Proxy({
      get expiresAt() {
        return expiresAt;
      },
      get data() {
        return data;
      },
      get flashData() {
        return flashData;
      },
      destroy,
      setExpires,
    }, {
      set(target, p: never, newValue) {
        if (p in target || ["flash"].includes(p)) {
          throw new Error("Setter is not allowed for " + p);
        }
        data[p] = newValue;
        return true;
      },
      get(target, p: never) {
        if (p === "flash") {
          return (k: never, v: never) => {
            if (typeof k === "undefined") return flashData;
            if (typeof v === "undefined") {
              const value = flashData[k];
              delete flashData[k];
              return value;
            }
            flashData[k] = v;
            return v;
          };
        }
        return (p in target) ? target[p] : data[p];
      },
    }) as unknown as Session;
  return async (c, next) => {
    // reset
    expiresAt = null;
    destroy();
    try {
      // get cookie
      const cdata = c.req.cookie(cookieName);
      if (
        cdata && await Jwt.verify(cdata, CONF.secret, AlgorithmTypes.HS512)
      ) {
        const { payload } = Jwt.decode(cdata);
        data = payload.data || {};
        flashData = payload.flashData || {};
        expiresAt = payload.expiresAt || null;
      }
    } catch (e) {}
    c.session = proxy;
    await next();
    const tokenValue = await Jwt.sign(
      { data, expiresAt, flashData },
      CONF.secret,
      AlgorithmTypes.HS512,
    );
    if (expiresAt) {
      cookieOptions.expires = new Date(expiresAt);
    }
    // save cookie
    c.cookie(cookieName, tokenValue, cookieOptions);
  };
}

function createHonoApp(id = crypto.randomUUID()) {
  // @ts-expect-error
  if (globalThis[id]) {
    // throw if has in global
    throw new Error(
      `"${id}" Identifier has in global. please use another one.`,
    );
  }
  // @ts-expect-error
  globalThis[id] = true;
  return new Hono()
    .use(
      createPostgresMiddleware(),
      createSessionMiddleware(),
    )
    .all("/_hmr", createHMRHandler());
}

/** types */
declare module "https://deno.land/x/hono@v2.7.2/mod.ts" {
  export class Context {
    db: PGPoolClient;
    session: Session;
  }
}
type Session = {
  [k: string]: unknown | unknown[] | Record<string, unknown>;
} & {
  data: Record<string, any>;
  flashData: Record<string, any>;
  expiresAt: Date | null;
  flash<K extends string, V extends string | undefined>(
    key?: K,
    value?: V,
  ): V | void;
  setExpires: (date: Date) => void;
  destroy: () => void;
};
type AnyRecord = Record<string, any>;
type JSXChild = string | number | JSXNode | JSXChild[];
type PropsWithChildren<T extends AnyRecord = AnyRecord> = {
  children?: JSXChild;
} & T;
