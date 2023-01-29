import { Environment, Hono, parseFlags, serve, z } from "../deps.ts";
import { initDB, type KyDB } from "./db.ts";

const HMR_SCRIPT =
  `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"/_hmr";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`;
const SOCKETS = new Set<WebSocket>();

let kydb: KyDB;
const schema = z.object({
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
    kydb = initDB(urlString);
    return kydb;
  }),
  secret: z.string().min(32),
  port: z.string().min(2).max(4).transform((s) => {
    let port = parseInt(s);
    if (isNaN(port)) {
      port = 8000;
    }
    return port;
  }),
});

export type Bindings = Readonly<z.infer<typeof schema>>;

export async function start<T extends Partial<Environment>>(
  app: Hono<T>,
  signal?: AbortSignal,
) {
  const honoApp = new Hono();
  honoApp.route("/", app);
  const ENV: Bindings = Object.seal(
    await schema.parseAsync(parseFlags(Deno.args, {
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
    })),
  );

  const reload = async () => {
    await kydb.destroy();
    SOCKETS.forEach((s) => {
      s.send("refresh");
    });
  };
  if (signal) {
    signal?.addEventListener("abort", reload);
  } else {
    globalThis.addEventListener("unload", reload);
  }
  serve((req: Request) => {
    const url = new URL(req.url);
    // serve hmr
    if (ENV.mode !== "production" && url.pathname === "/_hmr") {
      if (req.headers.get("upgrade") == "websocket") {
        const { response, socket } = Deno.upgradeWebSocket(req);
        SOCKETS.add(socket);
        socket.onclose = () => {
          SOCKETS.delete(socket);
        };
        return response;
      } else {
        return new Response(HMR_SCRIPT, {
          status: 200,
          headers: {
            "content-type": "application/javascript; charset=utf-8;",
            "cache-control": "private, max-age=0, must-revalidate",
          },
        });
      }
    }
    return honoApp.fetch(req, ENV);
  }, { signal, port: ENV.port });

  // let watcher: Deno.FsWatcher | undefined;
  // if (ENV.mode !== "production") {
  //   watcher = Deno.watchFs(new URL("./public", import.meta.url).pathname, {
  //     recursive: true,
  //   });

  //   (async () => {
  //     for await (const ev of watcher) {
  //       if (ev.kind === "modify" || ev.kind === "create") {
  //         RELOAD();
  //       }
  //     }
  //   })();
  // }
}
