import { type MiddlewareHandler } from "hono/mod.ts";

export function liveReloadServer({
  enabled = true,
  endpoint = "/_hmr",
  signal,
}: {
  /** A endpoint must start with "/" */
  endpoint?: string;
  enabled?: boolean;
  signal?: AbortSignal;
} = {}): MiddlewareHandler {
  if (!enabled) return (_, next) => next();
  const SOCKETS = new Set<WebSocket>();
  const reload = () => {
    SOCKETS.forEach((socket) => {
      socket.send("refresh");
    });
  };
  if (signal) {
    signal.addEventListener("abort", reload);
  } else {
    addEventListener("unload", reload);
  }
  return (ctx, next) => {
    if (ctx.req.header("upgrade") == "websocket") {
      const { response, socket } = Deno.upgradeWebSocket(
        ctx.req as unknown as Request,
      );
      SOCKETS.add(socket);
      socket.onclose = () => {
        SOCKETS.delete(socket);
      };
      ctx.res = response;
    } else {
      ctx.res = new Response(
        `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"${endpoint}";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`,
        {
          headers: {
            "content-type": "application/javascript; charset=utf-8;",
            "cache-control": "private, max-age=0, must-revalidate",
          },
        },
      );
    }
    ctx.finalized = true;
    return next();
  };
}
