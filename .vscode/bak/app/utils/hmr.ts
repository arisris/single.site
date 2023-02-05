export function handleHMR(path: string, req: Request, sockets: Set<WebSocket>) {
  if (req.headers.get("upgrade") == "websocket") {
    const { response, socket } = Deno.upgradeWebSocket(req);
    sockets.add(socket);
    socket.addEventListener("close", () => {
      sockets.delete(socket);
    });
    return response;
  } else {
    return new Response(
      `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"${path}";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`,
      {
        headers: {
          "content-type": "application/javascript; charset=utf-8;",
          "cache-control": "private, max-age=0, must-revalidate",
        },
      },
    );
  }
}
